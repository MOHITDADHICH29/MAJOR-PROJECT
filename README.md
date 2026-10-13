# NeuroFusion AI — Multimodal Schizophrenia Classification Platform

A production-grade, multi-site machine learning and clinical research platform for binary classification of **Schizophrenia Patients vs. Healthy Controls** using multimodal electroencephalography (EEG) and 3D structural T1w MRI.

---

## 📖 Project Overview & Information

### What is NeuroFusion AI?
NeuroFusion AI is an end-to-end translational neuroscience and machine learning research platform designed to overcome domain shift across disparate clinical acquisition sites. Traditional single-modality psychiatric assessment is vulnerable to sensor noise, electrode impedance variations, and institutional scanner drift. NeuroFusion AI harmonizes **high temporal resolution electrophysiology (16-channel EEG)** with **high spatial resolution 3D structural neuroimaging (T1w MRI)** using confidence-calibrated decision fusion.

### Clinical & Scientific Motivation
- **The Challenge**: Schizophrenia is characterized by subtle, multi-system neural alterations — prefrontal cortical thinning, ventricular enlargement, and fronto-temporal dysconnectivity — which can be missed or confounded when evaluated through a single modality or unstandardized signal scales.
- **The NeuroFusion Solution**:
  1. **Electrophysiological Domain Invariance**: Extracts 432 scale-invariant EEG features (relative Welch band powers, frontal $\theta/\alpha$ slowing indices, hemispheric asymmetry, and functional connectivity) eliminating multi-site voltage scaling errors.
  2. **Anatomical Atlas Parcellation**: Deconstructs 3D T1w MRIs into 111 stereotaxic regions of interest (MNI-152 frame), extracting gray/white matter tissue volumes, Ventricle-to-Brain Ratios (VBR), and 3D GLCM texture moments.
  3. **Synergistic Cross-Modal Decision Fusion**: Dynamically arbitrates between EEG and MRI predictions using certainty-gated soft voting, reaching **82.02% mean 5-fold cross-validation accuracy** (peak **89.50%**) and an **ROC-AUC of 0.8958**.
  4. **Interactive 3D Web Visualization**: Equips clinicians and researchers with real-time 3D anatomical models, interactive 10-20 electrode signal inspection, quantitative biomarker deviation profiling, and secure role-gated administrative controls.

---

## 🌐 Live Web Deployment & Demo Credentials

NeuroFusion AI is deployed on Firebase Hosting:

**Live URL**: [https://neurofusion-ai-79bca.web.app](https://neurofusion-ai-79bca.web.app)

### Demo Access Credentials

| Role | Email Identifier | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Doctor** | `doctor.demo@neurofusion.ai` | `DoctorDemo2026!` | Clinical Analysis Workspace, patient intake, 10-20 EEG viewer, tri-planar MRI slicer, 3D anatomical brain, severity estimation, clinical research report generation |
| **Developer** | `developer.demo@neurofusion.ai` | `DeveloperDemo2026!` | Model Development & Research Lab, 5-fold CV benchmarks, training runs, architecture comparisons, SHAP explainability, error attribution, doctor credential audit |
| *Doctor (Legacy)* | `doctor@neurofusion.org` | `doctor123` | Backwards-compatible clinician login |
| *Developer (Legacy)* | `developer@neurofusion.org` | `developer123` | Backwards-compatible developer login |

> **Offline & Cloud Architecture**: On Firebase Hosting, client-side authentication and high-fidelity neuroimaging data are supported with offline fallback, enabling full interactive exploration of all 3D viewers, EEG signal spectra, and multimodal decision matrices without requiring a local Python backend.

---

## 🚀 Getting Started (Fresh Clone — Run on Any System)

### Prerequisites
- **Python 3.9+**
- **Node.js 18+** and **npm**
- **Git**

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/MOHITDADHICH29/MAJOR-PROJECT.git
cd MAJOR-PROJECT
```

---

### Step 2 — Set Up the Python Backend

```bash
# Create a virtual environment
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

# Install all dependencies
pip install -r requirements.txt
```

---

### Step 3 — Set Up the React Frontend

```bash
cd frontend
npm install
cd ..
```

---

### Step 4 — Run the Application

Open **two terminals**:

**Terminal 1 — Start the Flask backend API:**
```bash
# Windows (with venv active):
.venv\Scripts\python.exe run_server.py

# macOS / Linux (with venv active):
python run_server.py
```
Backend will be available at: `http://127.0.0.1:5000`

**Terminal 2 — Start the React frontend:**
```bash
cd frontend
npm run dev
```
Dashboard will be available at: `http://localhost:5173`

---

## 🔬 Core Features & Interactive Capabilities

### 1. Natural 3D Human Nervous System (`HumanBody3D`)
- **Realistic Anatomy**: Full human nervous system with proportional head, cervical spine, ribcage, pelvis, arms, and legs.
- **Central & Peripheral Axis**: Cerebral cortex connected to a continuous cervical-to-sacral spinal cord with bilateral brachial, intercostal, sciatic, tibial, and digital filaments.
- **Natural Biological Materials**: Realistic cerebral gray matter, ivory myelinated spinal cord, and natural peripheral myelin filaments under clean clinical research illumination.
- **Camera Presets & Controls**: Front, Back, Head Zoom, and Reset buttons with smooth damping, zoom, pan, and auto-rotation toggle.
- **Macro-to-Micro Traversal**: Direct navigation from whole-body coordinate space into detailed cranial saliency.

### 2. Interactive 3D Brain & Clickable 10-20 Electrodes (`Brain3D`)
- **Standard 10-20 Electrode Montage**: Co-registered scalp electrodes (`Fp1`, `Fp2`, `F7`, `F3`, `Fz`, `F4`, `F8`, `T3`, `C3`, `Cz`, `C4`, `T4`, `T5`, `P3`, `Pz`, `P4`, `T6`, `O1`, `O2`).
- **Live Signal Intensity Calculation**: Independent click selection computing real microvolt amplitude ($\mu\text{V}$), intensity score ([0-1]), and relative band power spectrum ($\delta, \theta, \alpha, \beta, \gamma$) from the active subject's session.
- **Spectral Band Filtering**: Interactive frequency band selector dynamically coloring nodes based on regional activity.

### 3. Severity Estimation & Dual-Modality Graphs (`SeverityEstimationView`)
- **Research Severity Tiers**: Three justified statistical deviation bands:
  - **Tier 1**: Lower research biomarker deviation ($Z < 1.5\sigma$)
  - **Tier 2**: Intermediate research biomarker deviation ($1.5\sigma \le Z < 3.0\sigma$)
  - **Tier 3**: Higher research biomarker deviation ($Z \ge 3.0\sigma$)
- **Interactive Recharts Comparison**: Normalized statistical divergence $|Z|$ across EEG (frontal slowing, alpha asymmetry, coherence) and MRI (ventricular brain ratio, DLPFC thickness) with reference thresholds and custom tooltips.

### 4. Doctor Portal & Developer Console Architecture
- **Three-Step New Analysis Workflow**: Demographics $\rightarrow$ File Upload (EEG/MRI) $\rightarrow$ Inference Execution.
- **Doctor Credential Management Relocation**: Removed administrative review from Doctor Workspace; integrated into the authorized **Developer Console** under **Doctor Credentials** with status filtering (All, Pending, Approved, Rejected), secure document inspection, and required rejection reason auditing.

---

## 📊 Benchmark Performance Overview

| Modality | Pipeline Approach | Enrolled ($N$) | QC-Passed ($N$) | Mean 5-CV Accuracy | Mean F1-Score | Mean ROC-AUC | Peak Performance |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **EEG Only** | Machine-Invariant Relative PSD, Clinical Slowing Ratios, Asymmetry | **$124$** | **$124$** | **$77.43\% \pm 5.36\%$** | **$0.7675$** | **$0.8578$** | **$84.00\%$** (Fold 1) |
| **MRI Only** | 3D Anatomical Atlas Parcellation (111 ROIs) + 3D Radiomics | **$102$** | **$77$** †| **$72.58\% \pm 6.93\%$** | **$0.7981$** | **$0.7078$** | **$81.20\%$** (Fold 2) |
| **Multimodal Fusion** | **Synergistic Cross-Modal High-Confidence Decision Fusion** | **$226$** | **$201$** ‡ | **$82.02\%$ (HIGHEST)** 🚀 | **$0.8401$** | **$0.8958$** | **$89.50\%$** 🏆 |

> † **25 MRI scans excluded** during quality control (signal-to-noise ratio < 15 dB or failed atlas parcellation).  
> ‡ **Multimodal cohort ($N=201$)** = 124 EEG subjects + 77 QC-passed MRI subjects. All 226 enrolled subjects are indexed in `data/metadata/dataset_manifest.csv`.

---

## 📁 Repository Structure

```
d:/MAJOR PROJECT/
├── app/
│   ├── api.py                           # Flask REST API endpoints and role access control
│   └── mock_data.py                     # Research dataset and session structures
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── 3d/                      # HumanBody3D, Brain3D, DigitalBrain
│   │   │   ├── auth/                    # AdminDoctorReviewPanel, DoctorRegistrationModal
│   │   │   ├── eeg/                     # EEGViewer (10-20 waveforms, band powers)
│   │   │   ├── imaging/                 # NeuroimagingViewer (tri-planar MRI slicer)
│   │   │   ├── fusion/                  # MultimodalFusion decision analysis
│   │   │   └── ui/                      # Reusable Wix Medical design system tokens
│   │   ├── views/                       # DoctorWorkspaceView, DeveloperConsoleView, SeverityEstimationView
│   │   └── services/                    # api.ts Axios integration
├── models/
│   └── checkpoints/                     # Pre-trained EEG & MRI voting ensemble weights
├── scripts/
│   ├── train_cv_eeg.py                  # EEG 5-fold CV training script
│   ├── train_cv_mri.py                  # MRI 5-fold CV anatomical atlas script
│   └── evaluate_multimodal.py           # Cross-modal decision fusion benchmark
├── run_server.py                        # Backend application server starter
└── README.md                            # Project documentation
```

---

## 📄 License & Technical References

For detailed mathematical formulations and ensemble architectures, refer to:
- **`model_information.md`**: Biomarker equations, feature extraction pipelines, and fusion logic.
- **`final_results.md`**: Experimental evaluation, baseline comparisons, and fold breakdowns.
