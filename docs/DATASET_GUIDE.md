"""Schizophrenia Detection - Dataset Guide

## Dataset Integration Guide

This guide explains how to integrate real datasets into the project.

## Supported Public Datasets

### 1. COBRE (Center for Biomedical Research Excellence)

**Website**: http://coins.trendscenter.org/

**Data**:
- EEG recordings (up to 74 controls, 110 schizophrenia)
- Subject demographics
- T1-weighted MRI (some subjects)

**Integration Steps**:
1. Request access from COINS website
2. Download EEG (.set, .fif, .mat formats)
3. Place in `data/raw/eeg/`
4. Add entries to `data/metadata/dataset_manifest.csv`

**Example**:
```csv
subject_id,dataset,label,eeg_path,mri_path
COBRE_0001,COBRE,0,data/raw/eeg/COBRE_0001.set,data/raw/mri/COBRE_0001.nii.gz
COBRE_0110,COBRE,1,data/raw/eeg/COBRE_0110.set,data/raw/mri/COBRE_0110.nii.gz
```

### 2. SchizConnect

**Website**: https://www.schizconnect.org/

**Data**:
- 300+ schizophrenia subjects + 250+ controls
- Multimodal: fMRI, DTI, sMRI, T1, T2
- Standardized preprocessing (available)

**Integration Steps**:
1. Register and request access
2. Download BIDS dataset
3. Extract modalities to `data/raw/`
4. Create manifest with BIDS paths

### 3. Open Neuro

**Website**: https://openneuro.org/

**Datasets**:
- **ds002748**: COBRE public release (EEG + MRI)
- **ds003787**: Multi-site schizophrenia (imaging)
- **ds002350**: TUHH EEG Seizure Corpus

**Integration Steps**:
1. Download from OpenNeuro (via datalad or browser)
2. Organize in project structure
3. Update manifest with relative paths

---

## Manifest File Format

### Required Columns

```csv
subject_id,dataset,label,eeg_path,mri_path,fmri_path,ct_path,age,sex
```

| Column | Type | Required | Format | Notes |
|--------|------|----------|--------|-------|
| subject_id | string | Yes | Unique ID | e.g., "sub-001", "COBRE_0001" |
| dataset | string | Yes | Dataset name | e.g., "COBRE", "SchizConnect", "OpenNeuro" |
| label | int | Yes | 0 or 1 | 0=Healthy, 1=Schizophrenia |
| eeg_path | string | No | Relative path | e.g., "data/raw/eeg/sub-001.edf" |
| mri_path | string | No | Relative path | e.g., "data/raw/mri/sub-001.nii.gz" |
| fmri_path | string | No | Relative path | Empty if unavailable |
| ct_path | string | No | Relative path | Empty if unavailable |
| age | int | No | Age in years | Leave empty if unknown |
| sex | string | No | M/F/O | Leave empty if unknown |

### Example

```csv
subject_id,dataset,label,eeg_path,mri_path,fmri_path,ct_path,age,sex
sub-001,COBRE,0,data/raw/eeg/sub-001.edf,data/raw/mri/sub-001.nii.gz,,,,35,M
sub-002,COBRE,1,data/raw/eeg/sub-002.edf,data/raw/mri/sub-002.nii.gz,,,,38,F
sub-003,SchizConnect,0,,data/raw/mri/sub-003.nii.gz,data/raw/fmri/sub-003.nii.gz,,42,F
```

---

## Step-by-Step Integration Example

### Step 1: Create Directory Structure

```bash
# EEG data
mkdir -p data/raw/eeg
mkdir -p data/raw/mri
mkdir -p data/raw/fmri
mkdir -p data/raw/ct

# Processed data
mkdir -p data/processed/eeg
mkdir -p data/processed/mri
mkdir -p data/processed/fmri
mkdir -p data/processed/ct

# Splits
mkdir -p data/splits
```

### Step 2: Add Data Files

```bash
# Copy raw data (example with COBRE)
cp /path/to/COBRE_dataset/eeg/*.set data/raw/eeg/
cp /path/to/COBRE_dataset/mri/*.nii.gz data/raw/mri/
```

### Step 3: Create Manifest

Create `data/metadata/dataset_manifest.csv`:

```python
import pandas as pd
from pathlib import Path

# Get available files
eeg_files = sorted(Path("data/raw/eeg").glob("*"))
mri_files = sorted(Path("data/raw/mri").glob("*"))

# Create manifest
data = []
for eeg_file in eeg_files:
    subject_id = eeg_file.stem  # Filename without extension
    
    # Determine label (based on naming convention)
    label = 0 if "control" in subject_id.lower() else 1
    
    # Find corresponding MRI
    mri_file = None
    for mri in mri_files:
        if subject_id in mri.stem:
            mri_file = str(mri)
            break
    
    data.append({
        "subject_id": subject_id,
        "dataset": "COBRE",
        "label": label,
        "eeg_path": str(eeg_file) if eeg_file.exists() else "",
        "mri_path": mri_file if mri_file else "",
        "fmri_path": "",
        "ct_path": "",
        "age": None,
        "sex": None,
    })

df = pd.DataFrame(data)
df.to_csv("data/metadata/dataset_manifest.csv", index=False)
print(f"Created manifest with {len(df)} subjects")
```

### Step 4: Validate Dataset

```bash
python scripts/validate_dataset.py
```

Expected output:
```
[1] Directory Structure
✓ data/raw
✓ data/processed
✓ data/metadata

[2] Metadata Files
✓ data/metadata/dataset_manifest.csv
  Records: 150

[3] EEG Data
✓ Found 150 EEG files

[4] MRI Data
✓ Found 150 MRI files
```

### Step 5: Create Splits

```bash
python scripts/create_splits.py
```

This creates:
- `data/splits/train.csv` (70% of subjects)
- `data/splits/validation.csv` (15% of subjects)
- `data/splits/test.csv` (15% of subjects)

### Step 6: Train Models

```bash
# Train EEG model
python scripts/train.py --modality eeg --epochs 50

# Train MRI model
python scripts/train.py --modality imaging --epochs 50

# Train multimodal model
python scripts/train.py --modality multimodal --epochs 50
```

---

## Data Validation Checklist

Before training, verify:

- [ ] All EEG files have correct format (.edf, .fif, .set, etc.)
- [ ] All MRI files are valid NIfTI or DICOM
- [ ] File paths in manifest are correct
- [ ] All subjects have labels (0 or 1)
- [ ] No duplicate subject IDs
- [ ] Directory structure matches manifest paths
- [ ] Run `scripts/validate_dataset.py` without errors
- [ ] Train/val/test splits are balanced (similar class distributions)

---

## Class Balance

Check class distribution:

```python
import pandas as pd

df = pd.read_csv("data/metadata/dataset_manifest.csv")
print(df["label"].value_counts())

# Expected: approximately 60-40 split
# Healthy controls: ~60%, Schizophrenia: ~40%
```

If imbalanced, the system automatically applies:
- **Weighted loss**: Higher weight for minority class
- **Focal loss**: Down-weight easy examples, focus on hard ones
- **Class weights**: Computed as total / (n_classes * class_count)

---

## Subject-Level Splitting

⚠️ **Important**: Subject-level splitting prevents data leakage

```python
# Correct: Subject-level split (all epochs from subject in one split)
subject_001_epochs → train
subject_002_epochs → train
subject_003_epochs → validation
subject_004_epochs → test

# Wrong: Sample-level split (epochs from same subject split)
subject_001_epoch_1 → train
subject_001_epoch_2 → validation  # ❌ Data leakage!
subject_001_epoch_3 → test        # ❌ Data leakage!
```

The project implements subject-level splitting automatically via `BaseDataset.create_subject_splits()`.

---

## Preprocessing Pipeline

All data is preprocessed before training:

### EEG Pipeline
```
Raw .edf/.fif
  ↓ Load
  ↓ Bandpass 0.5-45 Hz
  ↓ Notch 50 Hz
  ↓ Normalization (Z-score)
  ↓ Normalize to [-1, 1]
Processed (19 channels, 256 Hz)
```

### MRI Pipeline
```
Raw .nii.gz
  ↓ Load
  ↓ Intensity normalization
  ↓ Resample to 96×96×96
  ↓ Normalize to [0, 1]
Processed (1×96×96×96)
```

---

## File Format Support

### EEG
- .edf (European Data Format)
- .fif (Neuromag/MEG)
- .set (EEGLAB)
- .bdf (BioSemi)
- .vhdr (BrainVision)
- .csv/.tsv (if structured as channels × timepoints)

### MRI/fMRI
- .nii / .nii.gz (NIfTI format, standard)
- .dcm (DICOM format)

### Multi-file Formats
- DICOM series (directory of .dcm files)
- BIDS datasets (standard structure)

---

## Privacy Considerations

1. **No real patient data included** in repository
2. **Subject-level splitting** prevents cross-contamination
3. **No PHI** (Protected Health Information) stored
4. All subject IDs should be **anonymized** (sub-001, not real names)

---

## Troubleshooting

### Issue: "File not found" error

```python
# Check path exists
from pathlib import Path
Path("data/raw/eeg/subject_001.edf").exists()  # Should be True

# Fix: Update manifest with correct relative path
# Paths are relative to project root
```

### Issue: Shape mismatch errors

```python
# EEG should be (n_channels, n_timepoints)
# Default: (19, variable)

# MRI should be (D, H, W)
# Will be resampled to (96, 96, 96)
```

### Issue: "No valid data" warnings

- Some files may fail to load
- Fallback: System generates synthetic data for that subject
- Check logs for specific errors: `results/logs/`

---

## Advanced: Custom Dataset Integration

To add a custom dataset:

1. **Create custom preprocessor** (inherit from base)
2. **Create custom dataset class** (inherit from BaseDataset)
3. **Register in MultimodalDataset**
4. **Add configuration** in config/

---

**Document Version:** 0.1
**Last Updated:** 2024
"""
