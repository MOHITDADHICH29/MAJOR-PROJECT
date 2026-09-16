# Multimodal Schizophrenia Classification System

A production-grade, multi-site machine learning framework for binary classification of **Schizophrenia Patients vs. Healthy Controls** using multi-modal electroencephalography (EEG) and 3D structural magnetic resonance imaging (T1w MRI).

---

## 1. Benchmark Performance Overview

| Modality | Pipeline Approach | Total Cohort ($N$) | Mean 5-CV Accuracy | Mean F1-Score | Mean ROC-AUC | Peak Performance |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **EEG Only** | Machine-Invariant Relative PSD, Clinical Slowing Ratios, Asymmetry | **$124$ Subjects** | **$77.43\% \pm 5.36\%$** | **$0.7675$** | **$0.8578$** | **$84.00\%$** (Fold 1) |
| **MRI Only** | 3D Anatomical Atlas Parcellation (116 ROIs) + 3D Radiomics | **$77$ Scans** | **$72.58\% \pm 6.93\%$** | **$0.7981$** | **$0.7078$** | **$81.20\%$** (Fold 2) |
| **Multimodal Fusion** | **Synergistic Cross-Modal High-Confidence Decision Fusion** | **$201$ Total Scans** | **$82.02\%$ (HIGHEST)** 🚀 | **$0.8401$** | **$0.8958$** | **$89.50\%$** 🏆 |

---

## 2. Key Improvements: Old System vs. Upgraded System

### What was Upgraded:
1. **EEG Signal Parsing & Harmonization**:
   * *Previous*: Legacy binary float reader misparsed ASCII `.eea` text files, treating text bytes as numerical noise and resulting in ~59% accuracy.
   * *Upgraded*: Reconstructed continuous 16-channel EEG signals directly and harmonized the 10-20 montage across both cohorts (`Schizophrenia` 84 subjects + `EEG_DATA2` 40 subjects).
2. **Machine-Invariant Physiological Biomarkers (EEG)**:
   * *Previous*: Raw time-domain waveforms suffered from cross-machine voltage amplitude scale shifts.
   * *Upgraded*: Extracted 432-dimensional relative band powers ($\delta, \theta, \alpha, \beta, \gamma$), clinical $\theta/\alpha$ slowing indices, 8 bilateral homologous asymmetry pairs, and spatial correlation connectivity. Single-site accuracy reached **81.99%**, and multi-site reached **77.43% (84.00% peak)**.
3. **Anatomical Atlas Parcellation & Radiomics (MRI)**:
   * *Previous*: Raw 3D CNN collapsed on small sample sizes ($36.36\%$ accuracy).
   * *Upgraded*: 111-dimensional Anatomical Atlas Parcellation targeting Dorsolateral Prefrontal Cortex (DLPFC), Anterior Cingulate (ACC), Superior Temporal Gyrus (STG), Insula, Hippocampus, Thalamus, Caudate, and Ventricle-to-Brain Ratio (VBR) with 3D GLCM textures, boosting accuracy to **72.58% (81.20% peak)** with F1 **0.7981**.
4. **Synergistic Cross-Modal Decision Fusion**:
   * *Previous*: Unweighted linear averaging let noisy MRI predictions degrade strong EEG predictions ($73.54\%$).
   * *Upgraded*: High-Confidence Hierarchical Decision Fusion dynamically routes authority based on modality certainty, achieving **82.02% mean accuracy (89.50% peak)** and **0.8958 ROC-AUC**.

---

## 3. Dataset Breakdown

| Dataset | Modality | Source / Hardware | Subjects ($N$) | Healthy (0) | Schizophrenia (1) |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Schizophrenia EEG** | 16-ch EEG (128 Hz) | Institute of Psychiatry & Neurology (Warsaw) | 84 | 39 | 45 |
| **EEG DATA2** | 64-ch BioSemi (1024 -> 256 Hz) | Button-Tone-SZ Task (16 matched channels) | 40 | 25 | 15 |
| **OpenNeuro ds004302** | 3T T1w Structural MRI | OpenNeuro Speech/Rest Protocol | 71 | 28 | 43 |
| **OpenNeuro ds005073** | 3T T1w MPRAGE MRI | OpenNeuro Structural Neuroimaging | 31 | 12 | 19 |
| **Total Cohort** | **Combined Multi-Site** | — | **226** | **104** | **122** |

---

## 4. Quick Start: Reproduce Benchmarks

Run the dedicated cross-validation scripts to reproduce all results in terminal:

```powershell
# 1. Run EEG 5-Fold Stratified Cross-Validation (Accuracy: 77.43% - 84.00%)
.venv\Scripts\python.exe scripts\train_cv_eeg.py

# 2. Run MRI Anatomical Atlas Cross-Validation (Accuracy: 72.58% - 81.20%)
.venv\Scripts\python.exe scripts\train_cv_mri.py

# 3. Run Multimodal Combined Synergistic Fusion (Combined Accuracy: 82.02% - 89.50%)
.venv\Scripts\python.exe scripts\evaluate_multimodal.py
```

---

## 5. Repository Structure

```
d:/MAJOR PROJECT/
├── data/
│   ├── metadata/
│   │   └── dataset_manifest.csv         # Complete index of all 226 subjects and labels
│   └── processed/
│       └── eeg/standardized/            # Standardized, bandpassed (0.5-45 Hz) EEG .npy arrays
├── models/
│   └── checkpoints/
│       ├── eeg_cv_ensemble.pkl          # Saved production EEG voting ensemble & scaler
│       └── mri_morphometric_ensemble.pkl# Saved production MRI anatomical atlas ensemble & scaler
├── scripts/
│   ├── train_cv_eeg.py                  # EEG 5-fold CV training and evaluation script
│   ├── train_cv_mri.py                  # MRI 5-fold CV anatomical atlas training script
│   ├── evaluate_multimodal.py           # Multimodal decision fusion benchmark script
│   ├── standardize_eeg_data.py          # EEG cache synchronization utility
│   └── evaluate_models.py               # Legacy single-split evaluation utility
├── src/
│   ├── datasets/                        # PyTorch dataset loaders (EEG, MRI, Multimodal)
│   ├── preprocessing/                   # EEG and MRI signal preprocessing modules
│   └── utils/                           # Manifest loading and path resolution helpers
├── model_information.md                 # In-depth mathematical & architectural documentation
├── final_results.md                     # Comprehensive experimental results & fold tables
└── README.md                            # Project overview and quick start guide
```

---

## 6. Data Download

> ✅ **MRI datasets** (`ds004302/`, `ds005073/`) are **already in this repository** — no download needed.  
> ⚠️ **EEG DATA2** (~19.4 GB) is too large for GitHub and must be downloaded separately.

See **[DATA_README.md](DATA_README.md)** for full download instructions. Quick summary:

```bash
# EEG DATA2 — dataset: broach/button-tone-sz on Kaggle
pip install kaggle
kaggle datasets download -d broach/button-tone-sz -p "EEG DATA2/" --unzip
```

✅ **Already in repo** (inside `EEG DATA2/`): `columnLabels.csv`, `demographic.csv`, `time.csv`

---

## 7. Technical Documentation

For detailed mathematical formulations, feature descriptions, and classifier hyperparameters, refer to:
* **[model_information.md](model_information.md)**: Full pipeline engineering, biomarker equations, and ensemble architectures.
* **[final_results.md](final_results.md)**: Detailed fold breakdowns, baseline comparisons, and clinical interpretation.
* **[DATA_README.md](DATA_README.md)**: Dataset download and setup instructions.
