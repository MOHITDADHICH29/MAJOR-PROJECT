# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
Advanced Boosted EEG Classifier
================================
Targets 80%+ accuracy using:
  1. Enriched 301-feature set (relative PSD, clinical ratios, spectral entropy,
     peak alpha frequency, hemispheric asymmetry, temporal moments)
  2. Soft-voting ensemble: XGBoost + LightGBM + ExtraTrees + LogReg
  3. SMOTE oversampling for class balance
  4. Optuna hyper-parameter search (40 XGB + 30 LGBM trials)
  5. Saves to models/checkpoints/eeg_boosted_ensemble.pkl
"""

import logging
import pickle
import sys
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.signal import welch
from scipy.stats import skew, kurtosis
from sklearn.ensemble import ExtraTreesClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, confusion_matrix, f1_score,
    precision_score, recall_score, roc_auc_score,
)
from sklearn.preprocessing import RobustScaler

warnings.filterwarnings("ignore")

project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

from src.utils.manifest import load_manifest
from src.utils.paths import resolve_data_path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ------------ constants ------------------------------------------------------
BANDS = {
    "delta": (0.5, 4.0),
    "theta": (4.0, 8.0),
    "alpha": (8.0, 13.0),
    "beta":  (13.0, 30.0),
    "gamma": (30.0, 45.0),
}

HOMOLOGOUS_PAIRS = [
    (2,  3),   # F3 / F4
    (4,  5),   # C3 / C4
    (6,  7),   # P3 / P4
    (8,  9),   # O1 / O2
    (10, 11),  # F7 / F8
    (12, 13),  # T7 / T8
    (14, 15),  # P7 / P8
]

FS = 256


# ------------ feature extraction ---------------------------------------------
def spectral_entropy(psd):
    p = psd / (psd.sum() + 1e-12)
    p = np.clip(p, 1e-12, None)
    return float(-np.sum(p * np.log(p)))


def peak_alpha_freq(freqs, psd):
    mask = (freqs >= 8.0) & (freqs < 13.0)
    if mask.sum() == 0:
        return 10.0
    return float(freqs[mask][np.argmax(psd[mask])])


def extract_features(eeg, fs=FS):
    """301-dim machine-invariant + temporal feature vector from (19,T) EEG."""
    n_ch = eeg.shape[0]
    nperseg = min(512, eeg.shape[-1])
    freqs, psd = welch(eeg, fs=fs, nperseg=nperseg, axis=-1)

    features = []
    rel_mat = np.zeros((n_ch, 5))

    for ch in range(n_ch):
        cp = psd[ch]
        total_p = 0.0
        bp_list = []
        for lo, hi in BANDS.values():
            mask = (freqs >= lo) & (freqs < hi)
            bp = float(np.sum(cp[mask]))
            bp_list.append(bp)
            total_p += bp

        total_p = max(total_p, 1e-12)
        rel = [bp / total_p for bp in bp_list]
        rel_mat[ch] = rel
        features.extend(rel)                            # 5

        d, t, a, b, g = rel
        features.append(t / max(a, 1e-5))              # theta/alpha
        features.append((d + t) / max(a + b, 1e-5))   # slow/fast
        features.append(g / max(a, 1e-5))              # gamma/alpha

        features.append(spectral_entropy(cp))           # 1
        features.append(peak_alpha_freq(freqs, cp))     # 1

    # Inter-hemispheric asymmetry for all 5 bands (7 pairs x 5 = 35)
    for li, ri in HOMOLOGOUS_PAIRS:
        for bi in range(5):
            al = rel_mat[li, bi]
            ar = rel_mat[ri, bi]
            features.append((ar - al) / max(ar + al, 1e-5))

    # Temporal moments per channel (4 x 19 = 76)
    for ch in range(n_ch):
        sig = eeg[ch]
        features.append(float(np.mean(sig)))
        features.append(float(np.std(sig)))
        features.append(float(skew(sig)))
        features.append(float(kurtosis(sig)))

    return np.array(features, dtype=np.float32)
    # Breakdown: 8*19=152 (rel+ratios+entropy+PAF) + 35 (asym) + 76 (temporal) = 263
    # Actually: 5+3+1+1=10 per ch -> 10*19=190; +35+76 = 301 total


# ------------ data loading ----------------------------------------------------
def load_features():
    manifest  = load_manifest("data/metadata/dataset_manifest.csv")
    train_ids = set(pd.read_csv("data/splits/train.csv")["subject_id"].astype(str))
    val_ids   = set(pd.read_csv("data/splits/validation.csv")["subject_id"].astype(str))
    test_ids  = set(pd.read_csv("data/splits/test.csv")["subject_id"].astype(str))

    eeg_entries = [e for e in manifest if e.get("eeg_path")]
    X_tr, y_tr, X_va, y_va, X_te, y_te, te_sids = [], [], [], [], [], [], []

    for i, e in enumerate(eeg_entries, 1):
        sid   = e["subject_id"]
        label = int(e["label"])
        path  = resolve_data_path(e["eeg_path"])
        try:
            data  = np.load(str(path))
        except Exception as exc:
            logger.warning(f"  Skip {sid}: {exc}")
            continue

        feats = extract_features(data)

        if sid in train_ids:
            X_tr.append(feats); y_tr.append(label)
        elif sid in val_ids:
            X_va.append(feats); y_va.append(label)
        elif sid in test_ids:
            X_te.append(feats); y_te.append(label)
            te_sids.append(sid)

        if i % 30 == 0 or i == len(eeg_entries):
            logger.info(f"  Features extracted: {i}/{len(eeg_entries)}")

    return (np.array(X_tr), np.array(y_tr),
            np.array(X_va), np.array(y_va),
            np.array(X_te), np.array(y_te),
            te_sids)


# ------------ SMOTE -----------------------------------------------------------
def oversample(X, y, seed=42):
    try:
        from imblearn.over_sampling import SMOTE
        counts = np.bincount(y)
        if counts.min() < counts.max() * 0.8:
            sm = SMOTE(random_state=seed, k_neighbors=min(5, int(counts.min()) - 1))
            X, y = sm.fit_resample(X, y)
            logger.info(f"  SMOTE -> {len(y)} balanced samples")
    except ImportError:
        logger.warning("  imbalanced-learn not found; skipping SMOTE")
    return X, y


# ------------ Optuna tuning ---------------------------------------------------
def tune_xgb(Xtr, ytr, Xva, yva, n_trials=40):
    try:
        import optuna, xgboost as xgb
        optuna.logging.set_verbosity(optuna.logging.WARNING)

        def obj(trial):
            p = dict(
                n_estimators     = trial.suggest_int("n_estimators", 200, 800),
                max_depth        = trial.suggest_int("max_depth", 3, 8),
                learning_rate    = trial.suggest_float("lr", 0.01, 0.2, log=True),
                subsample        = trial.suggest_float("subsample", 0.6, 1.0),
                colsample_bytree = trial.suggest_float("colsample", 0.5, 1.0),
                min_child_weight = trial.suggest_int("min_cw", 1, 10),
                gamma            = trial.suggest_float("gamma", 0.0, 1.0),
                reg_alpha        = trial.suggest_float("reg_alpha", 1e-4, 10.0, log=True),
                reg_lambda       = trial.suggest_float("reg_lambda", 1e-4, 10.0, log=True),
                eval_metric="logloss", use_label_encoder=False,
                random_state=42, n_jobs=-1,
            )
            clf = xgb.XGBClassifier(**p)
            clf.fit(Xtr, ytr, eval_set=[(Xva, yva)], verbose=False)
            return f1_score(yva, clf.predict(Xva), zero_division=0)

        study = optuna.create_study(direction="maximize")
        study.optimize(obj, n_trials=n_trials, show_progress_bar=False)
        logger.info(f"  XGB best F1={study.best_value:.4f} {study.best_params}")
        return study.best_params
    except ImportError:
        logger.warning("  XGBoost/Optuna not installed; using defaults")
        return {}


def tune_lgbm(Xtr, ytr, Xva, yva, n_trials=30):
    try:
        import lightgbm as lgb, optuna
        optuna.logging.set_verbosity(optuna.logging.WARNING)

        def obj(trial):
            p = dict(
                n_estimators     = trial.suggest_int("n_estimators", 200, 800),
                max_depth        = trial.suggest_int("max_depth", 3, 8),
                learning_rate    = trial.suggest_float("lr", 0.01, 0.2, log=True),
                num_leaves       = trial.suggest_int("num_leaves", 20, 100),
                subsample        = trial.suggest_float("subsample", 0.6, 1.0),
                colsample_bytree = trial.suggest_float("colsample", 0.5, 1.0),
                reg_alpha        = trial.suggest_float("reg_alpha", 1e-4, 10.0, log=True),
                reg_lambda       = trial.suggest_float("reg_lambda", 1e-4, 10.0, log=True),
                min_child_samples= trial.suggest_int("min_cs", 5, 30),
                random_state=42, n_jobs=-1, verbosity=-1,
            )
            clf = lgb.LGBMClassifier(**p)
            clf.fit(Xtr, ytr, eval_set=[(Xva, yva)],
                    callbacks=[lgb.early_stopping(30, verbose=False),
                               lgb.log_evaluation(-1)])
            return f1_score(yva, clf.predict(Xva), zero_division=0)

        study = optuna.create_study(direction="maximize")
        study.optimize(obj, n_trials=n_trials, show_progress_bar=False)
        logger.info(f"  LGBM best F1={study.best_value:.4f} {study.best_params}")
        return study.best_params
    except ImportError:
        logger.warning("  LightGBM/Optuna not installed; using defaults")
        return {}


# ------------ build ensemble --------------------------------------------------
def build_ensemble(xgb_p, lgbm_p):
    estimators = []

    try:
        import xgboost as xgb
        cfg = dict(n_estimators=400, max_depth=5, learning_rate=0.05,
                   subsample=0.8, colsample_bytree=0.8,
                   use_label_encoder=False, eval_metric="logloss",
                   random_state=42, n_jobs=-1)
        cfg.update(xgb_p)
        estimators.append(("xgb", xgb.XGBClassifier(**cfg)))
    except ImportError:
        pass

    try:
        import lightgbm as lgb
        cfg = dict(n_estimators=400, max_depth=5, learning_rate=0.05,
                   num_leaves=40, subsample=0.8, colsample_bytree=0.8,
                   random_state=42, n_jobs=-1, verbosity=-1)
        cfg.update(lgbm_p)
        estimators.append(("lgbm", lgb.LGBMClassifier(**cfg)))
    except ImportError:
        pass

    estimators.append(("et", ExtraTreesClassifier(
        n_estimators=500, max_features="sqrt", min_samples_leaf=2,
        class_weight="balanced", random_state=42, n_jobs=-1)))

    estimators.append(("lr", LogisticRegression(
        C=0.5, solver="lbfgs", max_iter=2000,
        class_weight="balanced", random_state=42)))

    return VotingClassifier(estimators=estimators, voting="soft", n_jobs=1)


# ------------ main ------------------------------------------------------------
def main():
    np.random.seed(42)
    logger.info("=" * 65)
    logger.info("  ADVANCED BOOSTED EEG ENSEMBLE  (target: 80%+)")
    logger.info("=" * 65)

    logger.info("\n[1/5] Extracting features ")
    X_tr, y_tr, X_va, y_va, X_te, y_te, te_sids = load_features()
    logger.info(f"  Train={len(X_tr)}  Val={len(X_va)}  Test={len(X_te)}  "
                f"Dims={X_tr.shape[1]}")

    logger.info("\n[2/5] RobustScaler ")
    scaler = RobustScaler()
    X_tr_s = scaler.fit_transform(X_tr)
    X_va_s = scaler.transform(X_va)
    X_te_s = scaler.transform(X_te)
    X_tv_s = np.vstack([X_tr_s, X_va_s])
    y_tv   = np.concatenate([y_tr, y_va])

    logger.info("\n[3/5] SMOTE ")
    X_tr_bal, y_tr_bal = oversample(X_tr_s, y_tr)

    logger.info("\n[4/5] Optuna hyper-parameter tuning ")
    xgb_params  = tune_xgb(X_tr_bal, y_tr_bal, X_va_s, y_va, n_trials=40)
    lgbm_params = tune_lgbm(X_tr_bal, y_tr_bal, X_va_s, y_va, n_trials=30)

    logger.info("\n[5/5] Final ensemble training (train+val) ")
    X_tv_bal, y_tv_bal = oversample(X_tv_s, y_tv)
    ensemble = build_ensemble(xgb_params, lgbm_params)
    ensemble.fit(X_tv_bal, y_tv_bal)

    # Evaluate
    probs = ensemble.predict_proba(X_te_s)[:, 1]
    preds = (probs >= 0.5).astype(int)

    acc  = accuracy_score(y_te, preds)
    prec = precision_score(y_te, preds, zero_division=0)
    rec  = recall_score(y_te, preds, zero_division=0)
    f1   = f1_score(y_te, preds, zero_division=0)
    auc  = roc_auc_score(y_te, probs)
    cm   = confusion_matrix(y_te, preds)

    logger.info("\n" + "=" * 65)
    logger.info("  FINAL TEST SET PERFORMANCE")
    logger.info("=" * 65)
    logger.info(f"  Accuracy  : {acc*100:.2f}%")
    logger.info(f"  Precision : {prec*100:.2f}%")
    logger.info(f"  Recall    : {rec*100:.2f}%")
    logger.info(f"  F1        : {f1*100:.2f}%")
    logger.info(f"  ROC-AUC   : {auc:.4f}")
    logger.info(f"  Confusion :\n{cm}")
    logger.info("=" * 65)
    logger.info("  TARGET ACHIEVED!" if acc >= 0.80 else f"  Accuracy={acc*100:.2f}% (target 80%)")

    # Save
    ckpt_dir = project_root / "models" / "checkpoints"
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    out = ckpt_dir / "eeg_boosted_ensemble.pkl"
    with open(out, "wb") as fh:
        pickle.dump({"ensemble": ensemble, "scaler": scaler,
                     "metrics": {"accuracy": acc, "f1": f1, "roc_auc": auc,
                                 "precision": prec, "recall": rec},
                     "feature_dim": X_tr.shape[1]}, fh)
    logger.info(f"  Saved -> {out}")
    return acc, f1, auc


if __name__ == "__main__":
    main()
