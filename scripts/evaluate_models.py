"""
Evaluation script to check accuracy and performance metrics for MRI, EEG, and Multimodal models.
"""

import argparse
import logging
import sys
from pathlib import Path
import pandas as pd
import numpy as np
import torch
from torch.utils.data import DataLoader
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)

sys.path.insert(0, str(Path(__file__).parent.parent))

from models.eeg import EEG1DCNN
from models.imaging import Imaging3DCNN
from models.fusion import LateFusion
from src.datasets.eeg_dataset import EEGDataset
from src.datasets.mri_dataset import MRIDataset
from src.datasets.multimodal_dataset import MultimodalDataset
from src.utils import ConfigLoader, get_device, get_logger, set_seed
from src.utils.manifest import filter_available, load_manifest

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
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
    """Load manifest entries for a given split (train, validation, test, or all)."""
    entries = load_manifest(manifest_path)
    if split == "all":
        return entries

    split_path = Path("data/splits") / f"{split}.csv"
    if split_path.exists():
        split_ids = set(pd.read_csv(split_path)["subject_id"].astype(str))
        return [e for e in entries if str(e.get("subject_id")) in split_ids]

    n = len(entries)
    train_end = int(0.7 * n)
    val_end = train_end + int(0.15 * n)

    if split == "train":
        return entries[:train_end]
    if split == "validation":
        return entries[train_end:val_end]
    return entries[val_end:]


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


def evaluate_dataset(model, dataloader, device, modality: str, class_names=None):
    """Run model evaluation and compute performance metrics."""
    if class_names is None:
        class_names = ["Healthy Control (0)", "Schizophrenia (1)"]

    model.eval()
    y_true = []
    y_pred = []
    y_scores = []
    subject_ids = []

    with torch.no_grad():
        for batch in dataloader:
            labels = batch["label"].to(device)
            sub_ids = batch["subject_id"]

            if modality == "eeg":
                output, _ = model(batch["eeg"].to(device))
            elif modality == "imaging" or modality == "mri":
                output, _ = model(batch["mri"].to(device))
            elif modality == "multimodal":
                output = model(batch["eeg"].to(device), batch["mri"].to(device))
            else:
                raise ValueError(f"Unknown modality: {modality}")

            probs = torch.softmax(output, dim=1).cpu().numpy()
            preds = torch.argmax(output, dim=1).cpu().numpy()

            y_true.extend(labels.cpu().numpy().tolist())
            y_pred.extend(preds.tolist())
            y_scores.extend(probs[:, 1].tolist() if probs.shape[1] > 1 else probs[:, 0].tolist())
            subject_ids.extend(sub_ids)

    # Compute metrics
    acc = accuracy_score(y_true, y_pred) if y_true else 0.0
    prec = precision_score(y_true, y_pred, zero_division=0) if y_true else 0.0
    rec = recall_score(y_true, y_pred, zero_division=0) if y_true else 0.0
    f1 = f1_score(y_true, y_pred, zero_division=0) if y_true else 0.0

    try:
        auc = roc_auc_score(y_true, y_scores) if len(set(y_true)) > 1 else float("nan")
    except Exception:
        auc = float("nan")

    cm = confusion_matrix(y_true, y_pred) if y_true else np.zeros((2, 2))
    report = classification_report(y_true, y_pred, target_names=class_names, zero_division=0)

    # Detailed results dataframe
    results_df = pd.DataFrame({
        "subject_id": subject_ids,
        "true_label": y_true,
        "true_name": [class_names[y] if y < len(class_names) else str(y) for y in y_true],
        "pred_label": y_pred,
        "pred_name": [class_names[p] if p < len(class_names) else str(p) for p in y_pred],
        "confidence_sz": y_scores,
        "is_correct": [t == p for t, p in zip(y_true, y_pred)],
    })

    return {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1": f1,
        "auc": auc,
        "confusion_matrix": cm,
        "classification_report": report,
        "total_samples": len(y_true),
        "results_df": results_df,
    }


def print_evaluation_summary(metrics: dict, modality: str, split_name: str):
    """Print formatted evaluation summary."""
    print("=" * 65)
    print(f" EVALUATION RESULTS: {modality.upper()} on '{split_name}' set")
    print("=" * 65)
    print(f" Total Samples Evaluated : {metrics['total_samples']}")
    print(f" Accuracy                : {metrics['accuracy'] * 100:.2f}%")
    print(f" Precision               : {metrics['precision'] * 100:.2f}%")
    print(f" Recall / Sensitivity    : {metrics['recall'] * 100:.2f}%")
    print(f" F1-Score                : {metrics['f1'] * 100:.2f}%")
    print(f" ROC-AUC Score           : {metrics['auc']:.4f}" if not np.isnan(metrics['auc']) else " ROC-AUC Score           : N/A (Single class present)")
    print("-" * 65)
    print(" Confusion Matrix:")
    print(f"   TN: {metrics['confusion_matrix'][0, 0]:<4} | FP: {metrics['confusion_matrix'][0, 1]:<4}")
    print(f"   FN: {metrics['confusion_matrix'][1, 0]:<4} | TP: {metrics['confusion_matrix'][1, 1]:<4}")
    print("-" * 65)
    print(" Detailed Classification Report:")
    print(metrics["classification_report"])
    print("=" * 65)


def evaluate_modality(modality: str, model_path: str, manifest_path: str, split: str, batch_size: int = 4):
    """Load model, dataset, and run evaluation for a given modality."""
    device = get_device()
    config_loader = ConfigLoader("config")
    entries = load_split_entries(Path(manifest_path), split=split)
    class_names = ["Control", "Schizophrenia"]

    if modality == "eeg":
        entries = filter_available(entries, "eeg")
        logger.info(f"Loaded {len(entries)} valid EEG samples for split '{split}'")
        if not entries:
            logger.warning("No EEG samples found.")
            return None

        eeg_config = config_loader.load_config("eeg_config").get("eeg", {})
        dataset = EEGDataset(entries, eeg_config=eeg_config)
        loader = DataLoader(dataset, batch_size=batch_size, shuffle=False, collate_fn=custom_collate_fn)

        model = EEG1DCNN(input_channels=19, output_dim=128, num_classes=2)
        model.load_state_dict(torch.load(model_path, map_location=device))
        model = model.to(device)

    elif modality in ["mri", "imaging"]:
        entries = filter_available(entries, "imaging")
        logger.info(f"Loaded {len(entries)} valid MRI samples for split '{split}'")
        if not entries:
            logger.warning("No MRI samples found.")
            return None

        imaging_config = config_loader.load_config("imaging_config").get("imaging", {})
        dataset = MRIDataset(entries, imaging_config=imaging_config)
        loader = DataLoader(dataset, batch_size=batch_size, shuffle=False, collate_fn=custom_collate_fn)

        model = Imaging3DCNN(input_channels=1, output_dim=128, num_classes=2)
        model.load_state_dict(torch.load(model_path, map_location=device))
        model = model.to(device)

    metrics = evaluate_dataset(model, loader, device, modality=modality, class_names=class_names)
    print_evaluation_summary(metrics, modality, split)
    return metrics


def main():
    parser = argparse.ArgumentParser(description="Check MRI and EEG model accuracy and metrics.")
    parser.add_argument(
        "--modality",
        default="both",
        choices=["eeg", "imaging", "mri", "both"],
        help="Modality to evaluate: 'eeg', 'mri' (imaging), or 'both'",
    )
    parser.add_argument(
        "--split",
        default="test",
        choices=["train", "validation", "test", "all"],
        help="Dataset split to evaluate on (default: test)",
    )
    parser.add_argument(
        "--eeg-model",
        default="models/checkpoints/eeg_model_best.pt",
        help="Path to trained EEG model weights",
    )
    parser.add_argument(
        "--mri-model",
        default="models/checkpoints/imaging_model_best.pt",
        help="Path to trained MRI model weights",
    )
    parser.add_argument(
        "--manifest",
        default="data/metadata/dataset_manifest.csv",
        help="Path to dataset manifest CSV",
    )
    parser.add_argument("--batch-size", type=int, default=4, help="Batch size for evaluation")
    parser.add_argument("--save-csv", default=None, help="Optional path to save per-subject predictions CSV")

    args = parser.parse_args()
    set_seed(42)

    results = {}
    if args.modality in ["eeg", "both"]:
        if Path(args.eeg_model).exists():
            print(f"\nEvaluating EEG Model from: {args.eeg_model}")
            eeg_res = evaluate_modality("eeg", args.eeg_model, args.manifest, args.split, args.batch_size)
            results["eeg"] = eeg_res
        else:
            logger.warning(f"EEG checkpoint not found at: {args.eeg_model}")

    if args.modality in ["mri", "imaging", "both"]:
        if Path(args.mri_model).exists():
            print(f"\nEvaluating MRI Model from: {args.mri_model}")
            mri_res = evaluate_modality("mri", args.mri_model, args.manifest, args.split, args.batch_size)
            results["mri"] = mri_res
        else:
            logger.warning(f"MRI checkpoint not found at: {args.mri_model}")

    if args.save_csv and "eeg" in results and results["eeg"]:
        results["eeg"]["results_df"].to_csv(f"eeg_{args.save_csv}", index=False)
        print(f"Saved EEG subject predictions to eeg_{args.save_csv}")
    if args.save_csv and "mri" in results and results["mri"]:
        results["mri"]["results_df"].to_csv(f"mri_{args.save_csv}", index=False)
        print(f"Saved MRI subject predictions to mri_{args.save_csv}")


if __name__ == "__main__":
    main()
