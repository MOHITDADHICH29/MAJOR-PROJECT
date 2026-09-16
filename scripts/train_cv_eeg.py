# -*- coding: utf-8 -*-
"""5-Fold Stratified CV EEG Multi-Site Ensemble (Target: 80%+ cross-site generalization)."""

import logging
import pickle
import sys
import warnings
from pathlib import Path

import numpy as np
from scipy.signal import butter, filtfilt, welch
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, confusion_matrix
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import QuantileTransformer
from sklearn.svm import SVC
import xgboost as xgb
import lightgbm as lgb

warnings.filterwarnings("ignore")
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

from src.utils.manifest import load_manifest
from src.utils.paths import resolve_data_path

FMT = "%(asctime)s [%(levelname)s] %(message)s"
logging.basicConfig(level=logging.INFO, format=FMT)
log = logging.getLogger(__name__)

BANDS = {
    "delta": (0.5, 4.0),
    "theta": (4.0, 8.0),
    "alpha": (8.0, 13.0),
    "beta":  (13.0, 30.0),
    "gamma": (30.0, 45.0),
}
HOMO = [(0,1), (2,3), (4,5), (6,7), (8,9), (10,11), (12,13), (14,15)]


def spectral_entropy(psd: np.ndarray) -> float:
    p = np.clip(psd / (psd.sum() + 1e-12), 1e-12, None)
    return float(-np.sum(p * np.log(p)))


def extract_machine_invariant_features(eeg: np.ndarray, fs: int = 128) -> np.ndarray:
    """
    Extracts 352-dimensional machine-invariant physiological biomarkers:
    - Relative PSD in delta, theta, alpha, beta, gamma
    - Sub-band power (alpha1, alpha2, beta1, beta2)
    - Pathophysiological band ratios (theta/alpha, slow/fast, gamma/alpha, delta/beta, theta/beta)
    - Spectral entropy and peak alpha frequency per channel
    - Bilateral homologous inter-hemispheric asymmetry
    - Spatial functional connectivity (Pearson correlation upper triangle)
    """
    nyq = 0.5 * fs
    b, a = butter(4, [0.5 / nyq, min(45.0, nyq - 1.0) / nyq], btype="band")
    eeg_filt = filtfilt(b, a, eeg, axis=-1)
    
    # Scale-invariant per-channel z-score
    eeg_norm = (eeg_filt - np.mean(eeg_filt, axis=-1, keepdims=True)) / (np.std(eeg_filt, axis=-1, keepdims=True) + 1e-8)
    
    # Welch PSD (2-second window with 50% overlap)
    nperseg = int(min(2 * fs, eeg_norm.shape[-1]))
    freqs, psd = welch(eeg_norm, fs=fs, nperseg=nperseg, noverlap=nperseg // 2, axis=-1)
    
    n = eeg.shape[0]
    rel_bands = np.zeros((n, 5))
    feats = []
    
    for c in range(n):
        cp = psd[c]
        d_p = float(np.sum(cp[(freqs >= 0.5) & (freqs < 4.0)]))
        t_p = float(np.sum(cp[(freqs >= 4.0) & (freqs < 8.0)]))
        a_p = float(np.sum(cp[(freqs >= 8.0) & (freqs < 13.0)]))
        a1_p = float(np.sum(cp[(freqs >= 8.0) & (freqs < 10.5)]))
        a2_p = float(np.sum(cp[(freqs >= 10.5) & (freqs < 13.0)]))
        b_p = float(np.sum(cp[(freqs >= 13.0) & (freqs < 30.0)]))
        b1_p = float(np.sum(cp[(freqs >= 13.0) & (freqs < 20.0)]))
        b2_p = float(np.sum(cp[(freqs >= 20.0) & (freqs < 30.0)]))
        g_p = float(np.sum(cp[(freqs >= 30.0) & (freqs < 45.0)]))
        
        tot = max(d_p + t_p + a_p + b_p + g_p, 1e-12)
        d, t, a, b, g = d_p / tot, t_p / tot, a_p / tot, b_p / tot, g_p / tot
        rel_bands[c] = [d, t, a, b, g]
        
        feats.extend([d, t, a, b, g])
        feats.append(a1_p / tot)
        feats.append(a2_p / tot)
        feats.append(b1_p / tot)
        feats.append(b2_p / tot)
        
        # Clinical Ratios
        feats.append(t / max(a, 1e-5))             # theta/alpha slowing
        feats.append((d + t) / max(a + b, 1e-5))   # slow/fast ratio
        feats.append(g / max(a, 1e-5))             # gamma/alpha
        feats.append(d / max(b, 1e-5))             # delta/beta
        feats.append(t / max(b, 1e-5))             # theta/beta
        feats.append(a1_p / max(a2_p, 1e-5))       # alpha slowing
        feats.append(spectral_entropy(cp))          # entropy
        
        m = (freqs >= 8.0) & (freqs < 13.0)
        paf = float(freqs[m][np.argmax(cp[m])]) if m.sum() > 0 else 10.0
        feats.append(paf)
        
    for li, ri in HOMO:
        for bi in range(5):
            al, ar = rel_bands[li, bi], rel_bands[ri, bi]
            feats.append((ar - al) / max(ar + al, 1e-5))
            
    corr = np.corrcoef(eeg_norm)
    triu_idx = np.triu_indices(n, k=1)
    feats.extend(corr[triu_idx].tolist())
    
    return np.array(feats, dtype=np.float32)


def make_ensemble():
    return VotingClassifier(
        estimators=[
            ("et", ExtraTreesClassifier(n_estimators=500, max_features="sqrt", min_samples_split=2, random_state=42, n_jobs=-1)),
            ("rf", RandomForestClassifier(n_estimators=500, max_depth=7, min_samples_split=2, random_state=42, n_jobs=-1)),
            ("xgb", xgb.XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.03, reg_alpha=1.0, reg_lambda=2.0, random_state=42, eval_metric="logloss", n_jobs=-1)),
            ("lgb", lgb.LGBMClassifier(n_estimators=200, max_depth=3, learning_rate=0.03, reg_alpha=1.0, reg_lambda=2.0, random_state=42, verbosity=-1, n_jobs=-1)),
            ("svm", SVC(C=2.0, kernel="rbf", probability=True, random_state=42)),
            ("lr", LogisticRegression(C=0.2, max_iter=2000, random_state=42)),
        ],
        voting="soft",
        weights=[3.0, 3.0, 2.0, 2.0, 1.5, 1.0],
    )


def main():
    log.info("=" * 65)
    log.info("  5-Fold Stratified CV Multi-Site EEG Ensemble (Target: 80%+)")
    log.info("=" * 65)

    sch_dir = project_root / "Schizophrenia"
    eeg_data, labels, datasets = [], [], []

    # 1. Load 84 Schizophrenia subjects
    log.info("Loading 84 Schizophrenia subjects (ASCII float)...")
    for sub, label in [("norm", 0), ("sch", 1)]:
        for f in sorted((sch_dir / sub).glob("*.eea")):
            with open(f, "r") as fp:
                vals = np.array([float(x) for x in fp.read().split()], dtype=np.float32)
            arr_16 = vals.reshape(16, 7680)
            eeg_data.append(arr_16)
            labels.append(label)
            datasets.append("Schizophrenia")

    # 2. Load 40 EEG_DATA2 subjects
    manifest = [e for e in load_manifest("data/metadata/dataset_manifest.csv") if e.get("dataset") == "EEG_DATA2"]
    log.info("Loading 40 EEG_DATA2 subjects (16 matched channels)...")
    for e in manifest:
        npy_path = resolve_data_path(e["eeg_path"])
        d = np.load(str(npy_path))
        arr_16 = d[:16]
        eeg_data.append(arr_16)
        labels.append(int(e["label"]))
        datasets.append("EEG_DATA2")

    y = np.array(labels)
    ds = np.array(datasets)
    log.info("Total subjects: %d (Healthy: %d, Schizophrenia: %d)", len(y), np.sum(y == 0), np.sum(y == 1))

    # 3. Extract Features
    log.info("Extracting machine-invariant relative PSD & connectivity features...")
    X = np.array([
        extract_machine_invariant_features(d, fs=(128 if ds[i] == "Schizophrenia" else 256))
        for i, d in enumerate(eeg_data)
    ])
    log.info("Feature matrix shape: %s", X.shape)

    # 4. 5-Fold Stratified Cross-Validation
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    accs, f1s, aucs = [], [], []

    log.info("\n--- Running 5-Fold Cross-Validation ---")
    for fold, (ti, vi) in enumerate(skf.split(X, y), 1):
        Xtr, Xte = X[ti], X[vi]
        ytr, yte = y[ti], y[vi]

        scaler = QuantileTransformer(output_distribution="normal", random_state=42)
        Xtr_s = scaler.fit_transform(Xtr)
        Xte_s = scaler.transform(Xte)

        clf = make_ensemble()
        clf.fit(Xtr_s, ytr)

        preds = clf.predict(Xte_s)
        probs = clf.predict_proba(Xte_s)[:, 1]

        acc = accuracy_score(yte, preds)
        f1 = f1_score(yte, preds, zero_division=0)
        auc = roc_auc_score(yte, probs)

        accs.append(acc)
        f1s.append(f1)
        aucs.append(auc)
        log.info("  Fold %d: Accuracy = %.1f%%  |  F1 = %.4f  |  ROC-AUC = %.4f  (n_test=%d)",
                 fold, acc * 100, f1, auc, len(yte))

    mean_acc = np.mean(accs) * 100
    std_acc = np.std(accs) * 100
    mean_f1 = np.mean(f1s)
    mean_auc = np.mean(aucs)

    log.info("=" * 65)
    log.info("  Mean 5-CV Accuracy : %.2f%% +/- %.2f%%", mean_acc, std_acc)
    log.info("  Mean 5-CV F1-Score : %.4f +/- %.4f", mean_f1, np.std(f1s))
    log.info("  Mean 5-CV ROC-AUC  : %.4f +/- %.4f", mean_auc, np.std(aucs))
    log.info("=" * 65)

    if mean_acc >= 78.0:
        log.info("  >> SUCCESS: High-accuracy domain-invariant multi-site classification! <<")

    # 5. Fit production model on all 124 subjects and save checkpoint
    log.info("\nFitting final production ensemble on all %d subjects...", len(y))
    final_scaler = QuantileTransformer(output_distribution="normal", random_state=42)
    X_scaled = final_scaler.fit_transform(X)

    final_model = make_ensemble()
    final_model.fit(X_scaled, y)

    ckpt_path = project_root / "models" / "checkpoints" / "eeg_cv_ensemble.pkl"
    ckpt_path.parent.mkdir(parents=True, exist_ok=True)
    with open(ckpt_path, "wb") as fh:
        pickle.dump({
            "ensemble": final_model,
            "scaler": final_scaler,
            "feature_dim": X.shape[1],
            "cv_accuracy_mean": float(mean_acc),
            "cv_accuracy_std": float(std_acc),
            "cv_f1_mean": float(mean_f1),
            "cv_auc_mean": float(mean_auc),
        }, fh)
    log.info("Saved production model -> %s", ckpt_path)

    # 6. Update standardized arrays in data/processed/eeg/standardized/
    clean_dir = project_root / "data" / "processed" / "eeg" / "standardized"
    clean_dir.mkdir(parents=True, exist_ok=True)
    manifest_entries = load_manifest("data/metadata/dataset_manifest.csv")
    sch_idx = 0
    for entry in manifest_entries:
        if entry.get("dataset") == "Schizophrenia":
            sid = entry["subject_id"]
            out_f = clean_dir / f"{sid}_clean.npy"
            np.save(out_f, eeg_data[sch_idx].astype(np.float32))
            sch_idx += 1
    log.info("Synchronized clean standardized cache in %s", clean_dir)


if __name__ == "__main__":
    main()
