# NeuroFusion AI — Multimodal Schizophrenia Classification Platform

A production-grade, multi-site machine learning and clinical research platform for binary classification of **Schizophrenia Patients vs. Healthy Controls** using multimodal electroencephalography (EEG) and 3D structural T1w MRI, featuring:
- **Interactive 3D Human Nervous System Visualization** with full central and peripheral neuro-conduits.
- **Detailed 3D Brain Mapping with 10-20 Electrode Coordinates** and real-time signal intensity extraction.
- **Interactive Severity Estimation Graphs** (Recharts multi-system divergence and 3-Tier research scale).
- **Comprehensive Doctor Portal & Clinical Workspace** with 3-step multimodal analysis initialization and report compilation.
- **Developer / ML Research Laboratory Console** with centralized **Doctor Credential Management** (audit trails, license document inspection, and status filtering).
- **Fast, Robust Flask REST API** with cross-modal decision fusion and verified machine learning models.

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
- **Central & Peripheral Axis**: Golden/natural cerebral cortex directly connected to a continuous cervical-to-sacral spinal cord with bilateral brachial, intercostal, sciatic, tibial, and digital filaments.
- **Camera Presets & Controls**: Front, Back, Head Zoom, and Reset buttons with smooth damping, zoom, pan, and auto-rotation toggle.
- **Smooth Macro-to-Micro Traversal**: Direct navigation from whole-body coordinate space into detailed cranial saliency.

### 2. Interactive 3D Brain & Clickable 10-20 Electrodes (`Brain3D`)
- **Standard 10-20 Electrode Montage**: Mapped scalp electrodes (`Fp1`, `Fp2`, `F7`, `F3`, `Fz`, `F4`, `F8`, `T3`, `C3`, `Cz`, `C4`, `T4`, `T5`, `P3`, `Pz`, `P4`, `T6`, `O1`, `O2`).
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
