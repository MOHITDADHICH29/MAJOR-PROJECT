import argparse
import csv
import os
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader

from dataset import MultimodalSZDataset
from models import (
    Classifier,
    EEGFeatureExtractor,
    FusionModule,
    ImagingFeatureExtractor,
    MultimodalSZClassifier,
)
from models.early_fusion import EarlyFusionClassifier


def parse_args():
    parser = argparse.ArgumentParser(description="Train multimodal schizophrenia classifier")
    parser.add_argument("--data_dir", type=str, default="data", help="Root data folder")
    parser.add_argument("--labels_csv", type=str, default="data/labels.csv", help="CSV file matching subjects to labels")
    parser.add_argument("--batch_size", type=int, default=8)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--device", type=str, default="cuda" if torch.cuda.is_available() else "cpu")
    parser.add_argument("--dummy", action="store_true", help="Use dummy synthetic data")
    parser.add_argument("--output_dir", type=str, default="outputs")

    # Architecture selection — early_fusion is now the default
    parser.add_argument(
        "--architecture",
        choices=["early_fusion", "late_fusion"],
        default="early_fusion",
        help="Model architecture (default: early_fusion)",
    )

    # Legacy late_fusion options (only used when --architecture late_fusion)
    parser.add_argument("--fusion_type", choices=["concat", "cross_attention"], default="concat")
    parser.add_argument("--imaging_backbone", choices=["cnn3d", "vit3d"], default="cnn3d")
    parser.add_argument("--classifier_type", choices=["mlp", "transformer"], default="mlp")

    # Early Fusion hyperparameters
    parser.add_argument("--embed_dim", type=int, default=256, help="Unified embedding dimension for early fusion")
    parser.add_argument("--transformer_depth", type=int, default=6, help="Number of Transformer layers in backbone")
    parser.add_argument("--transformer_heads", type=int, default=8, help="Number of attention heads in backbone")
    parser.add_argument("--ffn_dim", type=int, default=512, help="Feed-forward network dimension in backbone")
    parser.add_argument("--dropout", type=float, default=0.1, help="Dropout rate for early fusion model")
    parser.add_argument("--aux_loss_weight", type=float, default=0.3, help="Weight for auxiliary modality losses")

    # Training enhancements
    parser.add_argument("--label_smoothing", type=float, default=0.1, help="Label smoothing factor")
    parser.add_argument("--grad_clip", type=float, default=1.0, help="Gradient clipping max norm")
    parser.add_argument(
        "--lr_schedule",
        choices=["plateau", "cosine"],
        default="cosine",
        help="Learning rate scheduler",
    )
    parser.add_argument("--warmup_epochs", type=int, default=3, help="Warmup epochs for cosine scheduler")
    parser.add_argument("--weight_decay", type=float, default=0.01, help="AdamW weight decay")

    return parser.parse_args()


def collate_batch(batch):
    # Determine max time length (or cap to 2048 for memory efficiency)
    max_len = min(max(item[0].shape[1] for item in batch), 4096)
    target_channels = 19

    padded_eegs = []
    for item in batch:
        eeg = item[0]
        c, t = eeg.shape
        if c < target_channels:
            pad_c = torch.zeros(target_channels - c, t, dtype=eeg.dtype)
            eeg = torch.cat([eeg, pad_c], dim=0)
        elif c > target_channels:
            eeg = eeg[:target_channels, :]

        if t < max_len:
            pad_t = torch.zeros(target_channels, max_len - t, dtype=eeg.dtype)
            eeg = torch.cat([eeg, pad_t], dim=1)
        else:
            eeg = eeg[:, :max_len]
        padded_eegs.append(eeg)

    eeg_batch = torch.stack(padded_eegs)
    img_batch = torch.stack([item[1] for item in batch])
    labels = torch.stack([item[2] for item in batch])
    return eeg_batch, img_batch, labels


def compute_metrics(y_true, y_pred, y_scores):
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
        "auc": roc_auc_score(y_true, y_scores[:, 1]) if len(np.unique(y_true)) > 1 else 0.0,
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
    }


def save_results_csv(output_dir, epoch, metrics, mode="val"):
    results_file = Path(output_dir) / "results.csv"
    write_header = not results_file.exists()
    with open(results_file, mode="a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if write_header:
            writer.writerow([
                "epoch",
                "mode",
                "accuracy",
                "precision",
                "recall",
                "f1",
                "auc",
                "confusion_matrix",
            ])
        writer.writerow([
            epoch,
            mode,
            metrics["accuracy"],
            metrics["precision"],
            metrics["recall"],
            metrics["f1"],
            metrics["auc"],
            metrics["confusion_matrix"],
        ])


def evaluate(model, dataloader, device, architecture="early_fusion"):
    """Evaluate model on a dataloader, returning metrics dict."""
    model.eval()
    y_true, y_pred, y_scores = [], [], []
    loss_meter = []
    criterion = nn.CrossEntropyLoss()
    with torch.no_grad():
        for eeg, image, labels in dataloader:
            eeg = eeg.to(device)
            image = image.to(device)
            labels = labels.to(device)

            # Both architectures support model(eeg, image) -> logits
            logits = model(eeg, image)
            loss = criterion(logits, labels)
            loss_meter.append(loss.item())

            probs = torch.softmax(logits, dim=1).cpu().numpy()
            preds = np.argmax(probs, axis=1).tolist()
            y_true.extend(labels.cpu().tolist())
            y_pred.extend(preds)
            y_scores.extend(probs.tolist())

    metrics = compute_metrics(np.array(y_true), np.array(y_pred), np.array(y_scores))
    metrics["loss"] = float(np.mean(loss_meter)) if loss_meter else 0.0
    return metrics


def build_model(args, device):
    """Build the model based on the selected architecture."""
    if args.architecture == "early_fusion":
        model = EarlyFusionClassifier(
            eeg_channels=19,
            eeg_cnn_channels=(64, 128, 256),
            use_spectrogram=False,
            mri_in_channels=1,
            mri_cnn_channels=(32, 64, 128, 256),
            embed_dim=args.embed_dim,
            transformer_depth=args.transformer_depth,
            transformer_heads=args.transformer_heads,
            ffn_dim=args.ffn_dim,
            dropout=args.dropout,
            max_seq_len=256,
            num_classes=2,
            classifier_hidden=128,
            use_auxiliary_losses=True,
            aux_loss_weight=args.aux_loss_weight,
        ).to(device)
        print(f"[INFO] Built EarlyFusionClassifier: embed_dim={args.embed_dim}, "
              f"depth={args.transformer_depth}, heads={args.transformer_heads}, "
              f"ffn_dim={args.ffn_dim}, aux_weight={args.aux_loss_weight}")
    else:
        # Legacy Late Fusion path
        eeg_extractor = EEGFeatureExtractor()
        imaging_extractor = ImagingFeatureExtractor(backbone=args.imaging_backbone)
        fusion_module = FusionModule(strategy=args.fusion_type)
        classifier = Classifier(classifier_type=args.classifier_type)
        model = MultimodalSZClassifier(
            eeg_extractor=eeg_extractor,
            imaging_extractor=imaging_extractor,
            fusion_module=fusion_module,
            classifier=classifier,
        ).to(device)
        print(f"[INFO] Built LateFusion MultimodalSZClassifier: "
              f"backbone={args.imaging_backbone}, fusion={args.fusion_type}")

    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"[INFO] Total parameters: {total_params:,}")
    print(f"[INFO] Trainable parameters: {trainable_params:,}")

    return model


def build_scheduler(optimizer, args, steps_per_epoch):
    """Build the learning rate scheduler."""
    if args.lr_schedule == "cosine":
        # Linear warmup + cosine annealing
        warmup_steps = args.warmup_epochs * steps_per_epoch
        total_steps = args.epochs * steps_per_epoch

        def lr_lambda(step):
            if step < warmup_steps:
                return float(step) / max(1, warmup_steps)
            progress = float(step - warmup_steps) / max(1, total_steps - warmup_steps)
            return 0.5 * (1.0 + np.cos(np.pi * progress))

        return torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda), "step"
    else:
        return torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode="max", factor=0.5, patience=3
        ), "epoch"


def train():
    args = parse_args()
    device = torch.device(args.device)
    os.makedirs(args.output_dir, exist_ok=True)

    # ---- Dataset ----
    dataset = MultimodalSZDataset(
        data_dir=args.data_dir,
        labels_csv=args.labels_csv,
        dummy=args.dummy,
    )
    indices = list(range(len(dataset)))
    labels = [dataset.metadata[i]["label"] for i in indices]
    train_idx, val_idx = train_test_split(
        indices,
        test_size=0.2,
        stratify=labels if len(set(labels)) > 1 else None,
        random_state=42,
    )

    train_loader = DataLoader(
        dataset,
        batch_size=args.batch_size,
        sampler=torch.utils.data.SubsetRandomSampler(train_idx),
        collate_fn=collate_batch,
        num_workers=0,
    )
    val_loader = DataLoader(
        dataset,
        batch_size=args.batch_size,
        sampler=torch.utils.data.SubsetRandomSampler(val_idx),
        collate_fn=collate_batch,
        num_workers=0,
    )

    # ---- Model ----
    model = build_model(args, device)

    # ---- Loss / Optimizer / Scheduler ----
    class_weights = None
    if not args.dummy and len(set(labels)) > 1:
        class_sample_count = np.bincount(labels)
        class_weights = torch.tensor(
            [sum(class_sample_count) / (2.0 * c) if c > 0 else 1.0 for c in class_sample_count],
            dtype=torch.float32,
        ).to(device)

    criterion = nn.CrossEntropyLoss(
        weight=class_weights,
        label_smoothing=args.label_smoothing,
    )

    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=args.lr,
        weight_decay=args.weight_decay,
    )

    scheduler, sched_mode = build_scheduler(optimizer, args, len(train_loader))

    # ---- Training Loop ----
    best_val_f1 = -1.0
    best_checkpoint_path = Path(args.output_dir) / "best_model.pth"

    print(f"\n{'='*60}")
    print(f"Training: architecture={args.architecture}, epochs={args.epochs}")
    print(f"Dataset: {len(train_idx)} train / {len(val_idx)} val samples")
    print(f"{'='*60}\n")

    for epoch in range(1, args.epochs + 1):
        model.train()
        epoch_losses = []
        epoch_loss_details = {"main_loss": [], "eeg_aux_loss": [], "mri_aux_loss": []}

        for eeg, image, batch_labels in train_loader:
            eeg = eeg.to(device)
            image = image.to(device)
            batch_labels = batch_labels.to(device)
            optimizer.zero_grad()

            if args.architecture == "early_fusion":
                # Use auxiliary losses during training
                outputs = model.forward_with_aux(eeg, image)
                loss, loss_dict = model.compute_loss(outputs, batch_labels, criterion)
                for k in epoch_loss_details:
                    if k in loss_dict:
                        epoch_loss_details[k].append(loss_dict[k])
            else:
                logits = model(eeg, image)
                loss = criterion(logits, batch_labels)

            loss.backward()

            # Gradient clipping (stabilises Transformer training)
            if args.grad_clip > 0:
                torch.nn.utils.clip_grad_norm_(model.parameters(), args.grad_clip)

            optimizer.step()
            epoch_losses.append(loss.item())

            # Step-level scheduler update
            if sched_mode == "step":
                scheduler.step()

        # ---- Evaluation ----
        train_metrics = evaluate(model, train_loader, device, args.architecture)
        val_metrics = evaluate(model, val_loader, device, args.architecture)

        # Epoch-level scheduler update
        if sched_mode == "epoch":
            scheduler.step(val_metrics["f1"])

        current_lr = optimizer.param_groups[0]["lr"]

        print(f"Epoch {epoch}/{args.epochs}  (lr={current_lr:.2e})")
        print(f"  train loss: {np.mean(epoch_losses):.4f}, val loss: {val_metrics['loss']:.4f}")
        print(
            f"  val acc: {val_metrics['accuracy']:.4f}, f1: {val_metrics['f1']:.4f}, auc: {val_metrics['auc']:.4f}"
        )
        print(f"  confusion_matrix: {val_metrics['confusion_matrix']}")

        if args.architecture == "early_fusion" and epoch_loss_details["main_loss"]:
            main_avg = np.mean(epoch_loss_details["main_loss"])
            eeg_avg = np.mean(epoch_loss_details["eeg_aux_loss"]) if epoch_loss_details["eeg_aux_loss"] else 0.0
            mri_avg = np.mean(epoch_loss_details["mri_aux_loss"]) if epoch_loss_details["mri_aux_loss"] else 0.0
            print(f"  loss breakdown: main={main_avg:.4f}, eeg_aux={eeg_avg:.4f}, mri_aux={mri_avg:.4f}")

        save_results_csv(args.output_dir, epoch, train_metrics, mode="train")
        save_results_csv(args.output_dir, epoch, val_metrics, mode="val")

        if val_metrics["f1"] > best_val_f1:
            best_val_f1 = val_metrics["f1"]
            Path(args.output_dir).mkdir(parents=True, exist_ok=True)
            Path("models/checkpoints").mkdir(parents=True, exist_ok=True)
            save_payload = {
                "model_state_dict": model.state_dict(),
                "args": vars(args),
            }
            torch.save(save_payload, best_checkpoint_path)
            torch.save(save_payload, "models/checkpoints/early_fusion_multimodal_best.pth")
            torch.save(model.state_dict(), "models/checkpoints/early_fusion_multimodal_best.pt")
            print(f"  [SAVED] Saved best model to {best_checkpoint_path} and models/checkpoints/")

    print(f"\nTraining complete. Best val F1: {best_val_f1:.4f}")


if __name__ == "__main__":
    train()
