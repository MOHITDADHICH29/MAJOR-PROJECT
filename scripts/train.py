"""Training script using Schizophrenia EEG and ds004302 neuroimaging."""

import argparse
import logging
import sys
from pathlib import Path

import torch
from torch.utils.data import DataLoader, Subset

sys.path.insert(0, str(Path(__file__).parent.parent))

from models.eeg import EEG1DCNN
from models.imaging import Imaging3DCNN
from models.fusion import LateFusion
from src.datasets.eeg_dataset import EEGDataset
from src.datasets.mri_dataset import MRIDataset
from src.datasets.multimodal_dataset import MultimodalDataset
from src.training.losses import FocalLoss
from src.utils import ConfigLoader, get_device, get_logger, set_seed
from src.utils.manifest import filter_available, load_manifest

logging.basicConfig(level=logging.INFO)
logger = get_logger(__name__)


def custom_collate_fn(batch):
    """Collate batches for EEG, MRI, or multimodal samples."""
    if "eeg" in batch[0] and "mri" in batch[0]:
        max_length = max(item["eeg"].shape[1] for item in batch)
        padded_eegs = []
        labels = []

        for item in batch:
            eeg = item["eeg"]
            n_channels, n_samples = eeg.shape
            if n_samples < max_length:
                padding = torch.zeros(n_channels, max_length - n_samples)
                eeg = torch.cat([eeg, padding], dim=1)
            else:
                eeg = eeg[:, :max_length]
            padded_eegs.append(eeg)
            labels.append(item["label"])

        return {
            "eeg": torch.stack(padded_eegs),
            "mri": torch.stack([item["mri"] for item in batch]),
            "label": torch.tensor(labels, dtype=torch.long),
            "subject_id": [item["subject_id"] for item in batch],
        }

    if "mri" in batch[0]:
        return {
            "mri": torch.stack([item["mri"] for item in batch]),
            "label": torch.tensor([item["label"] for item in batch], dtype=torch.long),
            "subject_id": [item["subject_id"] for item in batch],
        }

    max_length = max(item["eeg"].shape[1] for item in batch)
    padded_eegs = []
    labels = []

    for item in batch:
        eeg = item["eeg"]
        n_channels, n_samples = eeg.shape
        if n_samples < max_length:
            padding = torch.zeros(n_channels, max_length - n_samples)
            eeg = torch.cat([eeg, padding], dim=1)
        else:
            eeg = eeg[:, :max_length]
        padded_eegs.append(eeg)
        labels.append(item["label"])

    return {
        "eeg": torch.stack(padded_eegs),
        "label": torch.tensor(labels, dtype=torch.long),
        "subject_id": [item["subject_id"] for item in batch],
    }


def load_split_entries(manifest_path: Path, split: str):
    """Load manifest entries for a named split."""
    split_path = Path("data/splits") / f"{split}.csv"
    if split_path.exists():
        import pandas as pd

        split_ids = set(pd.read_csv(split_path)["subject_id"].astype(str))
        entries = load_manifest(manifest_path)
        return [e for e in entries if e["subject_id"] in split_ids]

    entries = load_manifest(manifest_path)
    n = len(entries)
    train_end = int(0.7 * n)
    val_end = train_end + int(0.15 * n)

    if split == "train":
        return entries[:train_end]
    if split == "validation":
        return entries[train_end:val_end]
    return entries[val_end:]


def train_epoch(model, loader, criterion, optimizer, device, modality):
    model.train()
    total_loss = 0.0
    correct = 0
    total = 0

    for batch in loader:
        optimizer.zero_grad()
        labels = batch["label"].to(device)

        if modality == "eeg":
            output, _ = model(batch["eeg"].to(device))
        elif modality == "imaging":
            output, _ = model(batch["mri"].to(device))
        else:
            eeg_out, eeg_emb = model.eeg_model(batch["eeg"].to(device))
            mri_out, mri_emb = model.mri_model(batch["mri"].to(device))
            output = model.fusion({"eeg": eeg_emb, "mri": mri_emb})

        loss = criterion(output, labels)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        _, predicted = torch.max(output.data, 1)
        correct += (predicted == labels).sum().item()
        total += labels.size(0)

    return total_loss / max(len(loader), 1), correct / max(total, 1)


def evaluate(model, loader, criterion, device, modality):
    model.eval()
    total_loss = 0.0
    y_true = []
    y_pred = []
    y_scores = []

    with torch.no_grad():
        for batch in loader:
            labels = batch["label"].to(device)

            if modality == "eeg":
                output, _ = model(batch["eeg"].to(device))
            elif modality == "imaging":
                output, _ = model(batch["mri"].to(device))
            else:
                eeg_out, eeg_emb = model.eeg_model(batch["eeg"].to(device))
                mri_out, mri_emb = model.mri_model(batch["mri"].to(device))
                output = model.fusion({"eeg": eeg_emb, "mri": mri_emb})

            loss = criterion(output, labels)
            total_loss += loss.item()
            probs = torch.softmax(output, dim=1).cpu().numpy()
            preds = torch.argmax(output, dim=1).cpu().numpy()

            y_true.extend(labels.cpu().numpy().tolist())
            y_pred.extend(preds.tolist())
            y_scores.extend(probs[:, 1].tolist() if probs.shape[1] > 1 else probs[:, 0].tolist())

    from sklearn.metrics import (
        accuracy_score,
        precision_score,
        recall_score,
        f1_score,
        roc_auc_score,
        confusion_matrix,
    )

    avg_loss = total_loss / max(len(loader), 1)
    acc = accuracy_score(y_true, y_pred) if y_true else 0.0
    prec = precision_score(y_true, y_pred, zero_division=0) if y_true else 0.0
    rec = recall_score(y_true, y_pred, zero_division=0) if y_true else 0.0
    f1 = f1_score(y_true, y_pred, zero_division=0) if y_true else 0.0
    try:
        auc = roc_auc_score(y_true, y_scores) if len(set(y_true)) > 1 else 0.0
    except Exception:
        auc = 0.0
    cm = confusion_matrix(y_true, y_pred).tolist() if y_true else []

    metrics = {
        "loss": avg_loss,
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1": f1,
        "auc": auc,
        "confusion_matrix": cm,
    }
    return metrics



class MultimodalModel(torch.nn.Module):
    def __init__(self, eeg_model, mri_model, fusion):
        super().__init__()
        self.eeg_model = eeg_model
        self.mri_model = mri_model
        self.fusion = fusion

    def forward(self, eeg, mri):
        _, eeg_emb = self.eeg_model(eeg)
        _, mri_emb = self.mri_model(mri)
        return self.fusion({"eeg": eeg_emb, "mri": mri_emb})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--modality",
        default="eeg",
        choices=["eeg", "imaging", "multimodal"],
    )
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=0.0001)
    parser.add_argument(
        "--manifest",
        type=str,
        default="data/metadata/dataset_manifest.csv",
    )
    args = parser.parse_args()

    set_seed(42)
    device = get_device()
    config_loader = ConfigLoader("config")
    config = config_loader.load_config("config")
    eeg_config = config_loader.load_config("eeg_config").get("eeg", {})
    imaging_config = config_loader.load_config("imaging_config").get("imaging", {})

    manifest_path = Path(args.manifest)
    modality_key = "mri" if args.modality == "imaging" else args.modality

    train_entries = filter_available(load_split_entries(manifest_path, "train"), modality_key)
    val_entries = filter_available(load_split_entries(manifest_path, "validation"), modality_key)
    test_entries = filter_available(load_split_entries(manifest_path, "test"), modality_key)

    if not train_entries:
        raise ValueError(
            f"No {args.modality} subjects in training split. "
            "Run: python scripts/prepare_real_data.py && python scripts/create_splits.py"
        )

    logger.info("Training %s on real data", args.modality)
    logger.info("  Train: %d subjects", len(train_entries))
    logger.info("  Val:   %d subjects", len(val_entries))
    logger.info("  Test:  %d subjects", len(test_entries))
    if train_entries:
        datasets_used = sorted(set(e["dataset"] for e in train_entries))
        logger.info("  Datasets: %s", ", ".join(datasets_used))

    if args.modality == "eeg":
        train_dataset = EEGDataset(train_entries, eeg_config=eeg_config)
        val_dataset = EEGDataset(val_entries, eeg_config=eeg_config) if val_entries else None
        test_dataset = EEGDataset(test_entries, eeg_config=eeg_config) if test_entries else None
        model = EEG1DCNN(input_channels=19, output_dim=128, num_classes=2).to(device)
    elif args.modality == "imaging":
        train_dataset = MRIDataset(train_entries, imaging_config=imaging_config)
        val_dataset = MRIDataset(val_entries, imaging_config=imaging_config) if val_entries else None
        test_dataset = MRIDataset(test_entries, imaging_config=imaging_config) if test_entries else None
        model = Imaging3DCNN(input_channels=1, output_dim=128, num_classes=2).to(device)
    else:
        train_dataset = MultimodalDataset(
            train_entries,
            modalities=["eeg", "mri"],
            eeg_config=eeg_config,
            imaging_config=imaging_config,
        )
        val_dataset = (
            MultimodalDataset(
                val_entries,
                modalities=["eeg", "mri"],
                eeg_config=eeg_config,
                imaging_config=imaging_config,
            )
            if val_entries
            else None
        )
        test_dataset = (
            MultimodalDataset(
                test_entries,
                modalities=["eeg", "mri"],
                eeg_config=eeg_config,
                imaging_config=imaging_config,
            )
            if test_entries
            else None
        )
        eeg_model = EEG1DCNN(input_channels=19, output_dim=128, num_classes=2)
        mri_model = Imaging3DCNN(input_channels=1, output_dim=128, num_classes=2)
        fusion = LateFusion({"eeg": 128, "mri": 128}, fusion_dim=256, num_classes=2)
        model = MultimodalModel(eeg_model, mri_model, fusion).to(device)

    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=0,
        collate_fn=custom_collate_fn,
    )
    val_loader = (
        DataLoader(
            val_dataset,
            batch_size=args.batch_size,
            shuffle=False,
            num_workers=0,
            collate_fn=custom_collate_fn,
        )
        if val_dataset
        else None
    )
    test_loader = (
        DataLoader(
            test_dataset,
            batch_size=args.batch_size,
            shuffle=False,
            num_workers=0,
            collate_fn=custom_collate_fn,
        )
        if test_dataset
        else None
    )

    criterion = FocalLoss(alpha=0.25, gamma=2.0)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=10, gamma=0.5)

    checkpoint_dir = Path("models/checkpoints")
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    best_val_acc = -1.0
    best_val_metrics = {}

    for epoch in range(args.epochs):
        train_loss, train_acc = train_epoch(
            model, train_loader, criterion, optimizer, device, args.modality
        )

        if val_loader:
            val_metrics = evaluate(model, val_loader, criterion, device, args.modality)
            val_loss = val_metrics["loss"]
            val_acc = val_metrics["accuracy"]
            val_f1 = val_metrics["f1"]

            logger.info(
                "Epoch %3d/%d | Train Loss: %.4f | Train Acc: %.4f | Val Loss: %.4f | Val Acc: %.4f | Val F1: %.4f",
                epoch + 1,
                args.epochs,
                train_loss,
                train_acc,
                val_loss,
                val_acc,
                val_f1,
            )
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                best_val_metrics = val_metrics
                torch.save(model.state_dict(), checkpoint_dir / f"{args.modality}_model_best.pt")
        else:
            logger.info(
                "Epoch %3d/%d | Train Loss: %.4f | Train Acc: %.4f",
                epoch + 1,
                args.epochs,
                train_loss,
                train_acc,
            )

        scheduler.step()

    torch.save(model.state_dict(), checkpoint_dir / f"{args.modality}_model_final.pt")
    logger.info("Training complete. Best Validation Accuracy: %.4f", max(best_val_acc, 0.0))

    if test_loader:
        # Load best model for test evaluation
        best_model_path = checkpoint_dir / f"{args.modality}_model_best.pt"
        if best_model_path.exists():
            model.load_state_dict(torch.load(best_model_path, map_location=device))
        test_metrics = evaluate(model, test_loader, criterion, device, args.modality)
        logger.info("=" * 60)
        logger.info("TEST SET EVALUATION (%s)", args.modality.upper())
        logger.info("  Test Accuracy: %.4f", test_metrics["accuracy"])
        logger.info("  Test Precision: %.4f", test_metrics["precision"])
        logger.info("  Test Recall: %.4f", test_metrics["recall"])
        logger.info("  Test F1-Score: %.4f", test_metrics["f1"])
        logger.info("  Test ROC-AUC: %.4f", test_metrics["auc"])
        logger.info("  Confusion Matrix: %s", test_metrics["confusion_matrix"])
        logger.info("=" * 60)



if __name__ == "__main__":
    main()
