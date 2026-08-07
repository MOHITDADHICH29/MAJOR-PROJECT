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


def parse_args():
    parser = argparse.ArgumentParser(description="Train multimodal schizophrenia classifier")
    parser.add_argument("--data_dir", type=str, default="data", help="Root data folder")
    parser.add_argument("--labels_csv", type=str, default="data/labels.csv", help="CSV file matching subjects to labels")
    parser.add_argument("--batch_size", type=int, default=8)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--fusion_type", choices=["concat", "cross_attention"], default="concat")
    parser.add_argument("--imaging_backbone", choices=["cnn3d", "vit3d"], default="cnn3d")
    parser.add_argument("--classifier_type", choices=["mlp", "transformer"], default="mlp")
    parser.add_argument("--device", type=str, default="cuda" if torch.cuda.is_available() else "cpu")
    parser.add_argument("--dummy", action="store_true", help="Use dummy synthetic data")
    parser.add_argument("--output_dir", type=str, default="outputs")
    return parser.parse_args()


def collate_batch(batch):
    eeg_batch = torch.stack([item[0] for item in batch])
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


def evaluate(model, dataloader, device):
    model.eval()
    y_true, y_pred, y_scores = [], [], []
    loss_meter = []
    criterion = nn.CrossEntropyLoss()
    with torch.no_grad():
        for eeg, image, labels in dataloader:
            eeg = eeg.to(device)
            image = image.to(device)
            labels = labels.to(device)
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


def train():
    args = parse_args()
    device = torch.device(args.device)
    os.makedirs(args.output_dir, exist_ok=True)

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

    class_weights = None
    if not args.dummy and len(set(labels)) > 1:
        class_sample_count = np.bincount(labels)
        class_weights = torch.tensor(
            [sum(class_sample_count) / (2.0 * c) if c > 0 else 1.0 for c in class_sample_count],
            dtype=torch.float32,
        ).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=3)

    best_val_f1 = -1.0
    best_checkpoint_path = Path(args.output_dir) / "best_model.pth"

    for epoch in range(1, args.epochs + 1):
        model.train()
        epoch_losses = []
        for eeg, image, labels in train_loader:
            eeg = eeg.to(device)
            image = image.to(device)
            labels = labels.to(device)
            optimizer.zero_grad()
            logits = model(eeg, image)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()
            epoch_losses.append(loss.item())

        train_metrics = evaluate(model, train_loader, device)
        val_metrics = evaluate(model, val_loader, device)
        scheduler.step(val_metrics["f1"])

        print(f"Epoch {epoch}/{args.epochs}")
        print(f"  train loss: {np.mean(epoch_losses):.4f}, val loss: {val_metrics['loss']:.4f}")
        print(
            f"  val acc: {val_metrics['accuracy']:.4f}, f1: {val_metrics['f1']:.4f}, auc: {val_metrics['auc']:.4f}"
        )
        print(f"  confusion_matrix: {val_metrics['confusion_matrix']}")

        save_results_csv(args.output_dir, epoch, train_metrics, mode="train")
        save_results_csv(args.output_dir, epoch, val_metrics, mode="val")

        if val_metrics["f1"] > best_val_f1:
            best_val_f1 = val_metrics["f1"]
            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "args": vars(args),
                },
                best_checkpoint_path,
            )
            print(f"  Saved best model to {best_checkpoint_path}")

    print("Training complete.")


if __name__ == "__main__":
    train()
