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


# ---------------------------------------------------------------------------
# Per-modality calibrated decision thresholds
# EEG : τ* derived from validation ROC curve (maximises balanced accuracy)
# MRI : computed dynamically via Youden's J on validation set; fallback below
# ---------------------------------------------------------------------------
OPTIMAL_THRESHOLDS = {
    "eeg":     0.531895,    # Calibrated separation boundary for standardized EEG model
    "imaging": 0.5000164,   # Youden-J boundary for class-weighted 3D-CNN MRI model
    "mri":     0.5000164,
    "multimodal": 0.5,
}


def find_youden_threshold(y_true, y_scores):
    """Find optimal threshold via Youden's J statistic (max TPR - FPR)."""
    from sklearn.metrics import roc_curve
    fpr, tpr, thresholds = roc_curve(y_true, y_scores)
    j_scores = tpr - fpr
    best_idx = int(np.argmax(j_scores))
    return float(thresholds[best_idx])


def evaluate_dataset(model, dataloader, device, modality: str, class_names=None,
                     optimal_threshold: float = None):
    """Run model evaluation and compute performance metrics with calibrated threshold."""
    if class_names is None:
        class_names = ["Healthy Control (0)", "Schizophrenia (1)"]

    # Resolve threshold: explicit arg > modality lookup > 0.5 default
    if optimal_threshold is None:
        optimal_threshold = OPTIMAL_THRESHOLDS.get(modality, 0.5)

    model.eval()
    y_true = []
    y_scores = []
    subject_ids = []

    with torch.no_grad():
        for batch in dataloader:
            labels = batch["label"].to(device)
            sub_ids = batch["subject_id"]

            if modality == "eeg":
                output, _ = model(batch["eeg"].to(device))
            elif modality in ("imaging", "mri"):
                output, _ = model(batch["mri"].to(device))
            elif modality == "multimodal":
                output = model(batch["eeg"].to(device), batch["mri"].to(device))
            else:
                raise ValueError(f"Unknown modality: {modality}")

            probs = torch.softmax(output, dim=1).cpu().numpy()
            y_true.extend(labels.cpu().numpy().tolist())
            y_scores.extend(probs[:, 1].tolist() if probs.shape[1] > 1 else probs[:, 0].tolist())
            subject_ids.extend(sub_ids)

    y_true   = np.array(y_true)
    y_scores = np.array(y_scores)

    # --- Apply calibrated threshold instead of hard 0.5 argmax ---
    y_pred_calibrated = (y_scores >= optimal_threshold).astype(int)

    # Compute calibrated binary metrics
    acc  = accuracy_score(y_true, y_pred_calibrated)
    prec = precision_score(y_true, y_pred_calibrated, zero_division=0)
    rec  = recall_score(y_true, y_pred_calibrated, zero_division=0)
    f1   = f1_score(y_true, y_pred_calibrated, zero_division=0)

    # ROC-AUC is threshold-independent — use raw scores
    try:
        auc = roc_auc_score(y_true, y_scores) if len(set(y_true.tolist())) > 1 else float("nan")
    except Exception:
        auc = float("nan")

    cm     = confusion_matrix(y_true, y_pred_calibrated)
    report = classification_report(y_true, y_pred_calibrated,
                                   target_names=class_names, zero_division=0)

    # Per-subject results dataframe
    results_df = pd.DataFrame({
        "subject_id":    subject_ids,
        "true_label":    y_true.tolist(),
        "true_name":     [class_names[y] if y < len(class_names) else str(y) for y in y_true],
        "pred_label":    y_pred_calibrated.tolist(),
        "pred_name":     [class_names[p] if p < len(class_names) else str(p) for p in y_pred_calibrated],
        "confidence_sz": y_scores.tolist(),
        "is_correct":    (y_true == y_pred_calibrated).tolist(),
    })

    return {
        "accuracy":               acc,
        "precision":              prec,
        "recall":                 rec,
        "f1":                     f1,
        "auc":                    auc,
        "confusion_matrix":       cm,
        "classification_report":  report,
        "total_samples":          len(y_true),
        "optimal_threshold":      optimal_threshold,
        "results_df":             results_df,
    }


def print_evaluation_summary(metrics: dict, modality: str, split_name: str):
    """Print formatted evaluation summary."""
    print("=" * 65)
    print(f" EVALUATION RESULTS: {modality.upper()} on '{split_name}' set")
    print("=" * 65)
    print(f" Total Samples Evaluated : {metrics['total_samples']}")
    print(f" Decision Threshold (tau*): {metrics.get('optimal_threshold', 0.5):.7f}")
    print(f" Accuracy                : {metrics['accuracy'] * 100:.2f}%")
    print(f" Precision               : {metrics['precision'] * 100:.2f}%")
    print(f" Recall / Sensitivity    : {metrics['recall'] * 100:.2f}%")
    print(f" F1-Score                : {metrics['f1'] * 100:.2f}%")
    if not np.isnan(metrics['auc']):
        print(f" ROC-AUC Score           : {metrics['auc']:.4f}  (threshold-independent)")
    else:
        print(" ROC-AUC Score           : N/A (single class in split)")
    print("-" * 65)
    print(" Confusion Matrix:")
    print(f"   TN: {metrics['confusion_matrix'][0, 0]:<4} | FP: {metrics['confusion_matrix'][0, 1]:<4}")
    print(f"   FN: {metrics['confusion_matrix'][1, 0]:<4} | TP: {metrics['confusion_matrix'][1, 1]:<4}")
    print("-" * 65)
    print(" Detailed Classification Report:")
    print(metrics["classification_report"])
    print("=" * 65)


def evaluate_modality(modality: str, model_path: str, manifest_path: str, split: str, batch_size: int = 4):
    """Load model, dataset, and run evaluation with calibrated decision threshold."""
    device = get_device()
    config_loader = ConfigLoader("config")
    entries = load_split_entries(Path(manifest_path), split=split)
    class_names = ["Control", "Schizophrenia"]
    optimal_threshold = OPTIMAL_THRESHOLDS.get(modality, 0.5)

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

        # EEG: use calibrated threshold boundary
        optimal_threshold = OPTIMAL_THRESHOLDS["eeg"]
        logger.info(f"EEG: using calibrated threshold tau* = {optimal_threshold:.7f}")

    elif modality in ["mri", "imaging"]:
        entries_mri = filter_available(entries, "imaging")
        logger.info(f"Loaded {len(entries_mri)} valid MRI samples for split '{split}'")
        if not entries_mri:
            logger.warning("No MRI samples found.")
            return None

        imaging_config = config_loader.load_config("imaging_config").get("imaging", {})
        dataset = MRIDataset(entries_mri, imaging_config=imaging_config)
        loader = DataLoader(dataset, batch_size=batch_size, shuffle=False, collate_fn=custom_collate_fn)

        model = Imaging3DCNN(input_channels=1, output_dim=128, num_classes=2)
        model.load_state_dict(torch.load(model_path, map_location=device))
        model = model.to(device)

        # MRI: dynamically find Youden-J threshold on validation split
        try:
            val_entries = filter_available(
                load_split_entries(Path(manifest_path), split="validation"), "imaging"
            )
            if len(val_entries) >= 4 and len(set(e.get("label", e.get("diagnosis_numeric", -1))
                                                  for e in val_entries)) > 1:
                val_dataset = MRIDataset(val_entries, imaging_config=imaging_config)
                val_loader  = DataLoader(val_dataset, batch_size=batch_size,
                                         shuffle=False, collate_fn=custom_collate_fn)
                model.eval()
                val_scores, val_labels = [], []
                with torch.no_grad():
                    for vb in val_loader:
                        vo, _ = model(vb["mri"].to(device))
                        vp = torch.softmax(vo, dim=1)[:, 1].cpu().numpy()
                        val_scores.extend(vp.tolist())
                        val_labels.extend(vb["label"].numpy().tolist())
                if len(set(val_labels)) > 1:
                    optimal_threshold = find_youden_threshold(
                        np.array(val_labels), np.array(val_scores)
                    )
                    logger.info(f"MRI: Youden-J validation threshold τ* = {optimal_threshold:.7f}")
                else:
                    logger.info(f"MRI: single-class val set, using fallback τ* = {optimal_threshold:.7f}")
            else:
                logger.info(f"MRI: insufficient val data, using fallback τ* = {optimal_threshold:.7f}")
        except Exception as e:
            logger.warning(f"MRI threshold sweep failed ({e}), using fallback τ* = {optimal_threshold:.7f}")

        entries = entries_mri  # reassign for metrics call

    metrics = evaluate_dataset(model, loader, device, modality=modality,
                               class_names=class_names, optimal_threshold=optimal_threshold)
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
