#!/usr/bin/env python3
"""Machine-invariant Spectral EEG Classification using Relative PSD and Clinical Ratios."""

import argparse
import logging
from pathlib import Path
import sys

import numpy as np
import pandas as pd
from scipy.signal import welch
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.preprocessing import RobustScaler, StandardScaler
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

from src.utils.manifest import load_manifest
from src.utils.paths import resolve_data_path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Standard 10-20 homologous pairs for hemispheric asymmetry
HOMOLOGOUS_PAIRS = [
    ("F3", "F4", 2, 3),
    ("C3", "C4", 4, 5),
    ("P3", "P4", 6, 7),
    ("O1", "O2", 8, 9),
    ("F7", "F8", 10, 11),
    ("T7", "T8", 12, 13),
    ("P7", "P8", 14, 15),
]

BANDS = {
    "delta": (0.5, 4.0),
    "theta": (4.0, 8.0),
    "alpha": (8.0, 13.0),
    "beta": (13.0, 30.0),
    "gamma": (30.0, 45.0),
}


def extract_spectral_biomarkers(eeg_data: np.ndarray, fs: int = 256) -> np.ndarray:
    """Extract machine-invariant relative power spectral densities, ratios, and asymmetries.
    
    Args:
        eeg_data: (19, timepoints) array
        fs: sampling frequency (256 Hz)
    Returns:
        1D feature vector of physiological biomarkers.
    """
    freqs, psd = welch(eeg_data, fs=fs, nperseg=min(512, eeg_data.shape[-1]), axis=-1)
    n_channels = eeg_data.shape[0]
    
    rel_powers_by_channel = []
    features = []
    
    for ch in range(n_channels):
        ch_psd = psd[ch]
        total_p = 0.0
        bp_list = []
        for b_name, (l, h) in BANDS.items():
            mask = (freqs >= l) & (freqs < h)
            bp = float(np.sum(ch_psd[mask]))
            bp_list.append(bp)
            total_p += bp
            
        total_p = max(total_p, 1e-12)
        rel_powers = [bp / total_p for bp in bp_list]
        rel_powers_by_channel.append(rel_powers)
        features.extend(rel_powers)  # 19 * 5 = 95 features
        
        # Clinical slowing ratios (Schizophrenia clinical hallmark)
        delta, theta, alpha, beta, gamma = rel_powers
        features.append(theta / max(alpha, 1e-5))  # Theta/Alpha ratio
        features.append((delta + theta) / max(alpha + beta, 1e-5))  # Slow/Fast ratio
        features.append(gamma / max(alpha, 1e-5))  # Gamma/Alpha ratio
        
    # Inter-Hemispheric Asymmetry for Alpha and Theta
    for name_l, name_r, idx_l, idx_r in HOMOLOGOUS_PAIRS:
        alpha_l = rel_powers_by_channel[idx_l][2]
        alpha_r = rel_powers_by_channel[idx_r][2]
        alpha_asym = (alpha_r - alpha_l) / max(alpha_r + alpha_l, 1e-5)
        features.append(alpha_asym)
        
        theta_l = rel_powers_by_channel[idx_l][1]
        theta_r = rel_powers_by_channel[idx_r][1]
        theta_asym = (theta_r - theta_l) / max(theta_r + theta_l, 1e-5)
        features.append(theta_asym)
        
    return np.array(features, dtype=np.float32)


class DeepSpectralClassifier(nn.Module):
    """Deep residual MLP for machine-invariant spectral EEG classification."""
    
    def __init__(self, in_features: int = 166, hidden_dim: int = 128, dropout: float = 0.3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_features, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.BatchNorm1d(hidden_dim // 2),
            nn.GELU(),
            nn.Dropout(dropout),
            
            nn.Linear(hidden_dim // 2, 32),
            nn.BatchNorm1d(32),
            nn.GELU(),
            nn.Dropout(dropout * 0.5),
            
            nn.Linear(32, 2)
        )
        
    def forward(self, x):
        return self.net(x)


def load_dataset_features():
    manifest = load_manifest("data/metadata/dataset_manifest.csv")
    train_ids = set(pd.read_csv("data/splits/train.csv")["subject_id"].astype(str))
    val_ids = set(pd.read_csv("data/splits/validation.csv")["subject_id"].astype(str))
    test_ids = set(pd.read_csv("data/splits/test.csv")["subject_id"].astype(str))
    
    eeg_entries = [e for e in manifest if e.get("eeg_path")]
    
    X_train, y_train = [], []
    X_val, y_val = [], []
    X_test, y_test = [], []
    
    test_subjects = []
    
    for e in eeg_entries:
        sid = e["subject_id"]
        label = e["label"]
        p = resolve_data_path(e["eeg_path"])
        d = np.load(str(p))
        feats = extract_spectral_biomarkers(d)
        
        if sid in train_ids:
            X_train.append(feats)
            y_train.append(label)
        elif sid in val_ids:
            X_val.append(feats)
            y_val.append(label)
        elif sid in test_ids:
            X_test.append(feats)
            y_test.append(label)
            test_subjects.append(sid)
            
    return (
        np.array(X_train), np.array(y_train),
        np.array(X_val), np.array(y_val),
        np.array(X_test), np.array(y_test),
        test_subjects
    )


def train_spectral_model(epochs=60, lr=0.002):
    torch.manual_seed(42)
    np.random.seed(42)
    
    X_train, y_train, X_val, y_val, X_test, y_test, test_subs = load_dataset_features()
    logger.info(f"Loaded Features: Train={len(X_train)}, Val={len(X_val)}, Test={len(X_test)}, Dims={X_train.shape[1]}")
    
    scaler = RobustScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_val_s = scaler.transform(X_val)
    X_test_s = scaler.transform(X_test)
    
    device = torch.device("cpu")
    model = DeepSpectralClassifier(in_features=X_train.shape[1]).to(device)
    
    # Inverse frequency weighting
    class_weights = torch.tensor([
        len(y_train) / (2.0 * np.sum(y_train == 0)),
        len(y_train) / (2.0 * np.sum(y_train == 1)),
    ], dtype=torch.float32).to(device)
    
    criterion = nn.CrossEntropyLoss(weight=class_weights, label_smoothing=0.05)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-3)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)
    
    train_ds = TensorDataset(torch.from_numpy(X_train_s).float(), torch.from_numpy(y_train).long())
    train_loader = DataLoader(train_ds, batch_size=16, shuffle=True)
    
    best_val_f1 = 0.0
    best_state = None
    
    for ep in range(1, epochs + 1):
        model.train()
        for batch_x, batch_y in train_loader:
            optimizer.zero_grad()
            out = model(batch_x)
            loss = criterion(out, batch_y)
            loss.backward()
            optimizer.step()
            
        scheduler.step()
        
        # Validation
        model.eval()
        with torch.no_grad():
            val_out = model(torch.from_numpy(X_val_s).float())
            val_probs = torch.softmax(val_out, dim=1)[:, 1].numpy()
            val_preds = (val_probs >= 0.5).astype(int)
            val_f1 = f1_score(y_val, val_preds, zero_division=0)
            
            if val_f1 > best_val_f1 or best_state is None:
                best_val_f1 = val_f1
                best_state = model.state_dict().copy()
                
    if best_state is not None:
        model.load_state_dict(best_state)
        
    # Final Test Evaluation
    model.eval()
    with torch.no_grad():
        test_out = model(torch.from_numpy(X_test_s).float())
        test_probs = torch.softmax(test_out, dim=1)[:, 1].numpy()
        
    test_preds = (test_probs >= 0.5).astype(int)
    acc = accuracy_score(y_test, test_preds)
    prec = precision_score(y_test, test_preds, zero_division=0)
    rec = recall_score(y_test, test_preds, zero_division=0)
    f1 = f1_score(y_test, test_preds, zero_division=0)
    auc = roc_auc_score(y_test, test_probs)
    cm = confusion_matrix(y_test, test_preds)
    
    logger.info("=" * 60)
    logger.info("SPECTRAL EEG CLASSIFIER TEST SET PERFORMANCE")
    logger.info("=" * 60)
    logger.info(f"Test Accuracy        : {acc * 100:.2f}%")
    logger.info(f"Test Precision       : {prec * 100:.2f}%")
    logger.info(f"Test Recall          : {rec * 100:.2f}%")
    logger.info(f"Test F1-Score        : {f1 * 100:.2f}%")
    logger.info(f"Test ROC-AUC         : {auc:.4f}")
    logger.info(f"Confusion Matrix:\n{cm}")
    logger.info("=" * 60)
    
    # Save model and scaler
    ckpt_dir = project_root / "models" / "checkpoints"
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    torch.save({
        "model_state": model.state_dict(),
        "scaler": scaler,
        "metrics": {"accuracy": acc, "f1": f1, "roc_auc": auc}
    }, ckpt_dir / "eeg_spectral_model_best.pt")
    logger.info("Saved model to models/checkpoints/eeg_spectral_model_best.pt")
    
    return acc, prec, rec, f1, auc


if __name__ == "__main__":
    train_spectral_model()
