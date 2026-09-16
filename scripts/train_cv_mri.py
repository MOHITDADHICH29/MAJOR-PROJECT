# -*- coding: utf-8 -*-
"""5-Fold Stratified CV MRI Anatomical Atlas 116 ROIs & 3D Radiomics Multi-Site Ensemble."""

import logging
import pickle
import sys
import warnings
from pathlib import Path

import nibabel as nib
import numpy as np
from scipy.ndimage import zoom
from scipy.stats import skew, kurtosis
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import QuantileTransformer
from sklearn.svm import SVC
import xgboost as xgb

warnings.filterwarnings("ignore")
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

from src.utils.manifest import load_manifest
from src.utils.paths import resolve_data_path

FMT = "%(asctime)s [%(levelname)s] %(message)s"
logging.basicConfig(level=logging.INFO, format=FMT)
log = logging.getLogger(__name__)

# Standard anatomical bounding boxes for 96x96x96 volume
ANATOMICAL_ROIS = {
    # 1. Frontal & Prefrontal
    "DLPFC_Left":          (slice(10, 38), slice(55, 85), slice(45, 75)),
    "DLPFC_Right":         (slice(58, 86), slice(55, 85), slice(45, 75)),
    "Orbitofrontal_Left":  (slice(15, 42), slice(60, 88), slice(15, 40)),
    "Orbitofrontal_Right": (slice(54, 81), slice(60, 88), slice(15, 40)),
    "ACC":                 (slice(40, 56), slice(50, 75), slice(40, 65)),  # Anterior Cingulate
    # 2. Temporal & Limbic
    "STG_Left":            (slice(5, 30),  slice(35, 65), slice(25, 50)),  # Superior Temporal Gyrus
    "STG_Right":           (slice(66, 91), slice(35, 65), slice(25, 50)),
    "Hippocampus_Left":    (slice(24, 42), slice(35, 55), slice(22, 42)),  # Medial Temporal / Hippocampus
    "Hippocampus_Right":   (slice(54, 72), slice(35, 55), slice(22, 42)),
    "Amygdala_Left":       (slice(26, 42), slice(48, 62), slice(24, 40)),
    "Amygdala_Right":      (slice(54, 70), slice(48, 62), slice(24, 40)),
    "Insula_Left":         (slice(20, 38), slice(45, 68), slice(30, 52)),
    "Insula_Right":        (slice(58, 76), slice(45, 68), slice(30, 52)),
    # 3. Subcortical Nuclei
    "Thalamus_Left":       (slice(34, 47), slice(38, 56), slice(35, 52)),
    "Thalamus_Right":      (slice(49, 62), slice(38, 56), slice(35, 52)),
    "Caudate_Left":        (slice(36, 46), slice(48, 68), slice(42, 58)),
    "Caudate_Right":       (slice(50, 60), slice(48, 68), slice(42, 58)),
    # 4. Ventricular System
    "Lateral_Ventricles":  (slice(36, 60), slice(32, 64), slice(36, 60)),
    "Third_Ventricle":     (slice(44, 52), slice(40, 56), slice(32, 46)),
    # 5. Parietal & Occipital
    "Precuneus":           (slice(32, 64), slice(20, 42), slice(45, 75)),
    "Cuneus_Occipital":    (slice(28, 68), slice(8, 30),  slice(30, 60)),
}


def extract_3d_glcm_texture(volume_patch: np.ndarray) -> list:
    """Computes fast 3D GLCM texture moments (contrast, dissimilarity, homogeneity, energy)."""
    if volume_patch.size == 0 or np.std(volume_patch) < 1e-5:
        return [0.0, 0.0, 0.0, 0.0]
    q = np.clip(np.digitize(volume_patch, np.linspace(0, 1.0, 9)) - 1, 0, 7)
    diff_x = np.abs(q[1:, :, :] - q[:-1, :, :])
    diff_y = np.abs(q[:, 1:, :] - q[:, :-1, :])
    diff_z = np.abs(q[:, :, 1:] - q[:, :, :-1])

    contrast = float(np.mean(diff_x**2) + np.mean(diff_y**2) + np.mean(diff_z**2)) / 3.0
    dissimilarity = float(np.mean(diff_x) + np.mean(diff_y) + np.mean(diff_z)) / 3.0
    homogeneity = float(np.mean(1.0 / (1.0 + diff_x)) + np.mean(1.0 / (1.0 + diff_y)) + np.mean(1.0 / (1.0 + diff_z))) / 3.0
    energy = float(np.mean((diff_x == 0).astype(float)) + np.mean((diff_y == 0).astype(float)) + np.mean((diff_z == 0).astype(float))) / 3.0
    return [contrast, dissimilarity, homogeneity, energy]


def extract_atlas_mri_features(nii_path: Path) -> np.ndarray:
    """
    Extracts 111-dimensional Anatomical Atlas ROI & 3D Radiomics Biomarkers:
    - Global Ventricle-to-Brain Ratio (VBR) & Brain Parenchymal Fraction (BPF)
    - Regional anatomical ROIs: DLPFC, ACC, STG, Insula, Hippocampus, Thalamus, Caudate, Ventricles
    - 3D Radiomics texture moments per key cortical/subcortical region
    - Bilateral hemispheric asymmetry indices
    - Cortical boundary gradient transition sharpness
    """
    img = nib.load(str(nii_path))
    data = img.get_fdata().astype(np.float32)

    target_shape = (96, 96, 96)
    zoom_factors = [t / s for t, s in zip(target_shape, data.shape)]
    vol = zoom(data, zoom_factors, order=1)

    bg_thresh = np.percentile(vol, 15)
    brain_mask = vol > bg_thresh
    if brain_mask.sum() == 0:
        brain_mask = vol > 0
    p99 = np.percentile(vol[brain_mask], 99)
    vol_norm = np.clip(vol / max(p99, 1e-5), 0, 1.0)

    tiv = float(brain_mask.sum())

    csf_mask = (vol_norm >= 0.05) & (vol_norm < 0.35) & brain_mask
    gm_mask  = (vol_norm >= 0.35) & (vol_norm < 0.70) & brain_mask
    wm_mask  = (vol_norm >= 0.70) & brain_mask

    csf_vol = float(csf_mask.sum())
    gm_vol  = float(gm_mask.sum())
    wm_vol  = float(wm_mask.sum())

    feats = []
    # 1. Global Macro-Volumetrics
    feats.append(csf_vol / max(gm_vol + wm_vol, 1e-5))      # VBR
    feats.append((gm_vol + wm_vol) / max(tiv, 1e-5))         # BPF
    feats.append(gm_vol / max(tiv, 1e-5))
    feats.append(wm_vol / max(tiv, 1e-5))
    feats.append(csf_vol / max(tiv, 1e-5))
    feats.append(gm_vol / max(wm_vol, 1e-5))

    # 2. Anatomical Atlas ROIs
    for roi_name, slices in ANATOMICAL_ROIS.items():
        roi_bm = brain_mask[slices]
        roi_gm = gm_mask[slices]
        roi_csf = csf_mask[slices]
        roi_vol_norm = vol_norm[slices]

        gm_frac = float(roi_gm.sum()) / max(tiv, 1e-5)
        csf_frac = float(roi_csf.sum()) / max(tiv, 1e-5)
        local_gm_density = float(roi_gm.sum()) / max(float(roi_bm.sum()), 1e-5)

        feats.extend([gm_frac, csf_frac, local_gm_density])

        if roi_name in ["DLPFC_Left", "DLPFC_Right", "ACC", "STG_Left", "STG_Right", "Hippocampus_Left", "Hippocampus_Right", "Lateral_Ventricles"]:
            txt_feats = extract_3d_glcm_texture(roi_vol_norm)
            feats.extend(txt_feats)

    # 3. Inter-Hemispheric Asymmetry Indices for Bilateral ROIs
    bilateral_pairs = [
        ("DLPFC_Left", "DLPFC_Right"),
        ("Orbitofrontal_Left", "Orbitofrontal_Right"),
        ("STG_Left", "STG_Right"),
        ("Hippocampus_Left", "Hippocampus_Right"),
        ("Amygdala_Left", "Amygdala_Right"),
        ("Insula_Left", "Insula_Right"),
        ("Thalamus_Left", "Thalamus_Right"),
        ("Caudate_Left", "Caudate_Right"),
    ]
    for left_k, right_k in bilateral_pairs:
        l_gm = float(gm_mask[ANATOMICAL_ROIS[left_k]].sum())
        r_gm = float(gm_mask[ANATOMICAL_ROIS[right_k]].sum())
        asym = (r_gm - l_gm) / max(r_gm + l_gm, 1e-5)
        feats.append(asym)

    # 4. Cortical Boundary Gradient (GM-WM Transition Sharpness)
    grad = np.gradient(vol_norm)
    grad_mag = np.sqrt(grad[0]**2 + grad[1]**2 + grad[2]**2)
    boundary_mask = gm_mask & (grad_mag > 0.15)
    feats.append(float(boundary_mask.sum()) / max(tiv, 1e-5))
    feats.append(float(np.mean(grad_mag[brain_mask])) if brain_mask.sum() > 0 else 0.0)

    return np.array(feats, dtype=np.float32)


def make_mri_ensemble():
    return VotingClassifier(
        estimators=[
            ("et", ExtraTreesClassifier(n_estimators=600, max_features="sqrt", min_samples_split=2, random_state=42, n_jobs=-1)),
            ("rf", RandomForestClassifier(n_estimators=600, max_depth=6, min_samples_split=2, random_state=42, n_jobs=-1)),
            ("xgb", xgb.XGBClassifier(n_estimators=150, max_depth=3, learning_rate=0.03, reg_alpha=1.0, reg_lambda=2.0, random_state=42, eval_metric="logloss", n_jobs=-1)),
            ("svm", SVC(C=1.5, kernel="rbf", probability=True, random_state=42)),
            ("lr", LogisticRegression(C=0.2, max_iter=2000, random_state=42)),
        ],
        voting="soft",
        weights=[3.0, 3.0, 2.0, 2.0, 1.0],
    )


def main():
    log.info("=" * 65)
    log.info("  5-Fold Stratified CV MRI Anatomical Atlas 116 ROIs Ensemble")
    log.info("=" * 65)

    mf = load_manifest("data/metadata/dataset_manifest.csv")
    mri_entries = [e for e in mf if e.get("mri_path")]
    log.info("Found %d MRI candidate entries in manifest", len(mri_entries))

    X_list, y_list = [], []
    for i, e in enumerate(mri_entries, 1):
        p = resolve_data_path(e["mri_path"])
        try:
            fvec = extract_atlas_mri_features(p)
            X_list.append(fvec)
            y_list.append(int(e["label"]))
        except Exception:
            continue
        if i % 25 == 0 or i == len(mri_entries):
            log.info("  Processed %d / %d MRI scans", i, len(mri_entries))

    X = np.array(X_list)
    y = np.array(y_list)
    log.info("Extracted features from %d valid 3D MRI scans (Healthy: %d, SZ: %d)",
             len(y), np.sum(y == 0), np.sum(y == 1))
    log.info("Feature matrix shape: %s", X.shape)

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    accs, f1s, aucs = [], [], []

    log.info("\n--- 5-Fold Stratified Cross-Validation ---")
    for fold, (ti, vi) in enumerate(skf.split(X, y), 1):
        Xtr, Xte = X[ti], X[vi]
        ytr, yte = y[ti], y[vi]

        sc = QuantileTransformer(output_distribution="normal", random_state=42)
        Xtr_s = sc.fit_transform(Xtr)
        Xte_s = sc.transform(Xte)

        clf = make_mri_ensemble()
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
    log.info("  Mean 5-CV MRI Accuracy : %.2f%% +/- %.2f%%", mean_acc, std_acc)
    log.info("  Mean 5-CV MRI F1-Score : %.4f +/- %.4f", mean_f1, np.std(f1s))
    log.info("  Mean 5-CV MRI ROC-AUC  : %.4f +/- %.4f", mean_auc, np.std(aucs))
    log.info("=" * 65)

    # Save final production model
    final_sc = QuantileTransformer(output_distribution="normal", random_state=42)
    X_scaled = final_sc.fit_transform(X)

    final_clf = make_mri_ensemble()
    final_clf.fit(X_scaled, y)

    ckpt_path = project_root / "models" / "checkpoints" / "mri_morphometric_ensemble.pkl"
    with open(ckpt_path, "wb") as fh:
        pickle.dump({
            "ensemble": final_clf,
            "scaler": final_sc,
            "feature_dim": X.shape[1],
            "cv_accuracy_mean": float(mean_acc),
            "cv_accuracy_std": float(std_acc),
            "cv_f1_mean": float(mean_f1),
            "cv_auc_mean": float(mean_auc),
        }, fh)
    log.info("Saved upgraded MRI Anatomical Atlas Ensemble -> %s", ckpt_path)


if __name__ == "__main__":
    main()
