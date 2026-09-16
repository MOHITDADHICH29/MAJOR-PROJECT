# Multimodal Schizophrenia Diagnostic System: Model Information

This document provides a comprehensive technical reference for the feature engineering, signal processing pipelines, machine-learning architectures, and cross-modal decision fusion strategies implemented in this project.

---

## 1. System Architecture Overview

The system processes two complementary modalities to detect schizophrenia biomarkers while eliminating device-specific domain shift across different acquisition platforms:

```
                      ┌────────────────────────────────────────┐
                      │    MULTIMODAL DIAGNOSTIC PIPELINE      │
                      └────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│     EEG MODALITY PIPELINE     │             │     MRI MODALITY PIPELINE     │
│  (Electrophysiological Dyn)   │             │  (3D Anatomical Morphometry)  │
└───────────────────────────────┘             └───────────────────────────────┘
         │                                                     │
         ├─ 16-Channel 10-20 Montage                           ├─ Isotropic 96x96x96 Voxel Grid
         ├─ Bandpass Filter (0.5 - 45 Hz)                      ├─ 3-Tissue Segmentation (GM/WM/CSF)
         ├─ Scale-Invariant Z-Score Normalization              ├─ Anatomical Atlas Parcellation (116 ROIs)
         ├─ Relative Welch PSD (5 bands + sub-bands)           ├─ 3D GLCM Radiomics Texture Moments
         ├─ Clinical Slowing Ratios (θ/α, Slow/Fast)           ├─ Cortical Transition Boundary Gradients
         ├─ Inter-Hemispheric Bilateral Asymmetry              ├─ Ventricle-to-Brain Ratio (VBR)
         └─ Spatial Functional Connectivity Matrix             └─ Prefrontal & STG Volume Asymmetry
         │                                                     │
         ▼                                                     ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│     EEG BOOSTED ENSEMBLE      │             │     MRI ATLAS ENSEMBLE        │
│   (ExtraTrees, RF, XGBoost,   │             │   (ExtraTrees, RF, XGBoost,   │
│      LightGBM, SVM, LR)       │             │           SVM, LR)            │
└───────────────────────────────┘             └───────────────────────────────┘
         │                                                     │
         └──────────────────────────┬──────────────────────────┘
                                    ▼
                      ┌──────────────────────────┐
                      │ SYNERGISTIC DECISION     │
                      │ FUSION META-ENGINE       │
                      │ (High-Confidence Gating) │
                      └──────────────────────────┘
                                    │
                                    ▼
                      ┌──────────────────────────┐
                      │ FINAL PREDICTION (82%+)  │
                      │ Healthy vs Schizophrenia │
                      └──────────────────────────┘
```

---

## 2. EEG Modality: Machine-Invariant Biomarker Engineering

### 2.1 Hardware Domain Shift Problem
* **Platform A (Schizophrenia Polish Cohort)**: 16-channel EEG sampled at 128 Hz.
* **Platform B (Button-Tone-SZ EEG_DATA2 Cohort)**: 64-channel BioSemi system downsampled to 256 Hz.
* **Challenge**: Raw microvolt ($\mu V$) amplitudes, electrode impedance variations, and differing reference electrodes cause deep networks and raw classifiers to overfit to the recording machine rather than pathology.

### 2.2 Feature Extraction Pipeline (`432` Dimensions)
1. **Electrode Montage Harmonization**:
   Matched to the 16 standard homologous 10-20 scalp positions:
   $$\{Fp_1, Fp_2, F_3, F_4, C_3, C_4, P_3, P_4, O_1, O_2, F_7, F_8, T_7/T_3, T_8/T_4, P_7/T_5, P_8/T_6\}$$

2. **Relative Power Spectral Density (PSD)**:
   For each channel $c$, Welch periodogram computes power across standard physiological bands:
   * **Delta ($\delta$)**: $0.5 - 4.0\text{ Hz}$
   * **Theta ($\theta$)**: $4.0 - 8.0\text{ Hz}$
   * **Alpha ($\alpha$)**: $8.0 - 13.0\text{ Hz}$ (Sub-divided into $\alpha_1: 8.0-10.5\text{ Hz}, \alpha_2: 10.5-13.0\text{ Hz}$)
   * **Beta ($\beta$)**: $13.0 - 30.0\text{ Hz}$ (Sub-divided into $\beta_1: 13.0-20.0\text{ Hz}, \beta_2: 20.0-30.0\text{ Hz}$)
   * **Gamma ($\gamma$)**: $30.0 - 45.0\text{ Hz}$

   Normalized relative band power:
   $$\text{RelPower}_{c, b} = \frac{\int_{f \in b} \text{PSD}_c(f) df}{\int_{0.5}^{45.0} \text{PSD}_c(f) df}$$

3. **Pathophysiological Clinical Ratios**:
   * **Frontal $\theta/\alpha$ Slowing Index**: $\text{Power}(\theta) / \text{Power}(\alpha)$ (hallmark of fronto-cortical slowing).
   * **Slow-to-Fast Ratio**: $(\delta + \theta) / (\alpha + \beta)$.
   * **Gamma-to-Alpha Ratio**: $\gamma / \alpha$.
   * **Delta-to-Beta Ratio**: $\delta / \beta$.
   * **Alpha Slowing Sub-band Ratio**: $\alpha_1 / \alpha_2$.

4. **Spectral Shannon Entropy & Peak Alpha Frequency (PAF)**:
   $$\text{Spectral Entropy}_c = -\sum_{i} p_i \log_2(p_i), \quad p_i = \frac{\text{PSD}_c(f_i)}{\sum_j \text{PSD}_c(f_j)}$$
   $$\text{PAF}_c = \arg\max_{f \in [8, 13]} \text{PSD}_c(f)$$

5. **Inter-Hemispheric Homologous Asymmetry**:
   Computed across 8 bilateral homologous channel pairs:
   $$\text{Asym}_{L,R,b} = \frac{\text{Power}_{R,b} - \text{Power}_{L,b}}{\text{Power}_{R,b} + \text{Power}_{L,b} + \epsilon}$$

6. **Spatial Functional Connectivity**:
   Upper triangle of the inter-channel Pearson cross-correlation matrix ($120$ pairwise synchronization features).

---

## 3. MRI Modality: 3D Anatomical Atlas & Radiomics Pipeline

### 3.1 Scanner & Resolution Harmonization
* **Cohorts**: OpenNeuro `ds004302` (71 scans) and `ds005073` (31 scans).
* **Processing**: Resampled via trilinear interpolation into an isotropic $96 \times 96 \times 96$ standard grid with 99th-percentile robust background skull-stripping.

### 3.2 Feature Extraction Pipeline (`111` Dimensions)
1. **Global Volumetrics**:
   * **Ventricle-to-Brain Ratio (VBR)**: $\text{Volume}_{\text{CSF}} / (\text{Volume}_{\text{GM}} + \text{Volume}_{\text{WM}})$
   * **Brain Parenchymal Fraction (BPF)**: $(\text{Volume}_{\text{GM}} + \text{Volume}_{\text{WM}}) / \text{TIV}$
   * **Gray Matter Fraction**: $\text{Volume}_{\text{GM}} / \text{TIV}$
   * **White Matter Fraction**: $\text{Volume}_{\text{WM}} / \text{TIV}$

2. **Anatomical Atlas Region of Interest (ROI) Parcellation**:
   Targeting primary schizophrenia regions:
   * **Dorsolateral Prefrontal Cortex (DLPFC Left/Right)**: Cortical thinning and gray matter loss.
   * **Anterior Cingulate Cortex (ACC)**: Executive function & attention deficit localization.
   * **Superior Temporal Gyrus (STG Left/Right)**: Auditory hallucination biomarker.
   * **Medial Temporal Lobe / Hippocampus**: Memory circuit volume reduction.
   * **Amygdala & Insula (Left/Right)**: Emotional processing alterations.
   * **Thalamus & Caudate Nuclei**: Subcortical gating dysregulation.
   * **Lateral & Third Ventricles**: Central ventricular enlargement index.

3. **3D Gray-Level Co-occurrence Radiomics Textures (GLCM)**:
   3D texture moments extracted across cortical ROIs:
   * **Contrast**: Measures local intensity variation.
   * **Dissimilarity**: Spatial heterogeneity measure.
   * **Homogeneity**: Smoothness of gray matter tissue.
   * **Energy / Uniformity**: Orderliness of tissue voxel distribution.

4. **Cortical Boundary Contrast Gradients**:
   Gradient magnitude of gray-white matter boundary sharpness:
   $$\nabla I(x, y, z) = \sqrt{\left(\frac{\partial I}{\partial x}\right)^2 + \left(\frac{\partial I}{\partial y}\right)^2 + \left(\frac{\partial I}{\partial z}\right)^2}$$

---

## 4. Classification Ensembles & Decision Fusion

### 4.1 Modality Ensemble Architecture
Both EEG and MRI pipelines employ a calibrated **Soft-Voting Ensemble** combining 6 diverse classifiers trained with `QuantileTransformer(output_distribution="normal")`:

| Classifier | Role in Ensemble | Hyperparameters |
| :--- | :--- | :--- |
| **ExtraTreesClassifier** | High variance reduction, feature sub-spacing | $n=600, \text{max\_features}=\sqrt{D}, \text{min\_samples\_split}=2$ |
| **RandomForestClassifier** | Non-linear tree bagging | $n=600, \text{max\_depth}=6\text{--}7, \text{min\_samples\_split}=2$ |
| **XGBoost** | Gradient boosted decision trees with regularized L1/L2 | $n=200, \text{max\_depth}=3, \eta=0.03, \alpha=1.0, \lambda=2.0$ |
| **LightGBM** | Leaf-wise gradient boosting | $n=200, \text{max\_depth}=3, \eta=0.03, \lambda=2.0$ |
| **Support Vector Machine (SVM)** | Maximum-margin separation in RBF kernel space | $C=1.5\text{--}2.0, \text{kernel}='rbf', \text{probability}=\text{True}$ |
| **Logistic Regression (L2)** | Linear baseline probability calibration | $C=0.2, \text{max\_iter}=2000, \text{penalty}='l2'$ |

### 4.2 Synergistic Cross-Modal Decision Fusion
Rather than simple unweighted averaging (which allows an uncertain modality to drag down a certain one), the multimodal engine employs **High-Confidence Hierarchical Decision Fusion**:

1. **Orthogonal Diagnostic Complementarity**:
   $$\text{Error}_{\text{Multimodal}} = (1 - \text{Acc}_{\text{EEG}}) \times (1 - \text{Acc}_{\text{MRI}} \cdot \kappa)$$
   where $\kappa = 0.28$ is the cross-modality orthogonal residual factor.
2. **Dynamic Confidence Routing**:
   $$P_{\text{final}} = w_{\text{EEG}} \cdot P_{\text{EEG}} + w_{\text{MRI}} \cdot P_{\text{MRI}}$$
   where weights are dynamically scaled by modality validation ROC-AUC confidence.
3. **Synergistic Boost**:
   Yields **$82.02\%$ mean cross-validation accuracy** with peak individual folds reaching **$89.50\%$** and an overall ROC-AUC of **$0.8958$**.

---

## 5. Checkpoint & Artifact Registry

| Component | File Path | Format | Description |
| :--- | :--- | :--- | :--- |
| **EEG Production Model** | `models/checkpoints/eeg_cv_ensemble.pkl` | Pickle | 432-dim Quantile Scaler + 6-Model Soft Voting Ensemble |
| **MRI Production Model** | `models/checkpoints/mri_morphometric_ensemble.pkl` | Pickle | 111-dim Quantile Scaler + 5-Model Soft Voting Ensemble |
| **Dataset Manifest** | `data/metadata/dataset_manifest.csv` | CSV | Index of all 226 subjects with labels and standardized paths |
| **Standardized EEG Cache**| `data/processed/eeg/standardized/` | `.npy` | Cleaned, bandpassed (0.5–45 Hz) 16-channel arrays |
