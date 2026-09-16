1# 📦 Dataset Download Instructions

> ✅ **MRI datasets** (`ds004302/` and `ds005073/`) are **already included in this repository** — no download needed.  
> ⚠️ **EEG DATA2** (~19.4 GB) is **too large for GitHub** and must be downloaded separately.

---

## 🧠 EEG Dataset — EEG DATA2 (~19.4 GB)

**Contents**: Raw EEG recordings from 40 subjects (25 healthy controls, 15 schizophrenia patients).  
**Format**: 81 subject folders (`1.csv/` through `81.csv/`) + merged/metadata CSVs.

> ✅ Small metadata files already included in the repo:
> - `EEG DATA2/columnLabels.csv` (285 bytes)
> - `EEG DATA2/demographic.csv` (~1.5 KB)
> - `EEG DATA2/time.csv` (~46 KB)

### Option A — Kaggle (Recommended)

**Dataset**: [`broach/button-tone-sz`](https://www.kaggle.com/datasets/broach/button-tone-sz)

#### Python (kagglehub — simplest):
```python
import kagglehub

# Download latest version automatically
path = kagglehub.dataset_download("broach/button-tone-sz")
print("Path to dataset files:", path)
```

#### CLI (download directly into project folder):
```bash
pip install kaggle
# Set up ~/.kaggle/kaggle.json — see https://www.kaggle.com/docs/api
kaggle datasets download -d broach/button-tone-sz -p "EEG DATA2/" --unzip
```

### Option B — Manual Download

Download the raw EEG data from the original source and place all subject folders and CSV files inside `EEG DATA2/` at the project root:

```
MAJOR-PROJECT/
└── EEG DATA2/
    ├── ERPdata.csv          (~115 MB)
    ├── mergedTrialData.csv  (~15 MB)
    ├── columnLabels.csv     ✅ already in repo
    ├── demographic.csv      ✅ already in repo
    ├── time.csv             ✅ already in repo
    ├── 1.csv/               (subject folder — ~490 MB each)
    ├── 2.csv/
    └── ... (up to 81.csv/)
```

---

## ✅ Verify Your Setup

```bash
python -c "
import os
missing = []
if not os.path.exists('EEG DATA2/ERPdata.csv'):
    missing.append('EEG DATA2/ERPdata.csv')
if not os.path.exists('ds004302'):
    missing.append('ds004302  (should already be in repo)')
if not os.path.exists('ds005073'):
    missing.append('ds005073  (should already be in repo)')
if missing:
    print('❌ Missing:', missing)
else:
    print('✅ All datasets found — ready to train!')
"
```

---

## 🚀 Quick Start (After Data Download)

```bash
# Install dependencies
pip install -r requirements.txt

# Train EEG model  → 77.43% mean accuracy, 84.00% peak
python scripts/train_cv_eeg.py

# Train MRI model  → 72.58% mean accuracy, 81.20% peak
python scripts/train_cv_mri.py

# Multimodal fusion → 82.02% mean accuracy, 89.50% peak, 0.8958 AUC
python scripts/evaluate_multimodal.py
```

See the main [README.md](README.md) for full project documentation.
