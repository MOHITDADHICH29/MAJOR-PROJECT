"""Schizophrenia Multimodal AI - Quick Start Guide

## 5-Minute Quick Start

### 1. Setup
```bash
# Activate virtual environment
.venv\\Scripts\\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Validate environment
python scripts/setup_environment.py
```

### 2. Run Demo (with Synthetic Data)
```bash
# Train EEG model
python scripts/train.py --modality eeg --epochs 10

# Launch web app
streamlit run app/streamlit_app.py
```

### 3. Expected Output
- Console: Training progress and metrics
- Streamlit: Interactive web interface at http://localhost:8501

---

## Adding Real Datasets

### COBRE Dataset Example
1. Download from: http://coins.trendscenter.org/download.html

2. Organize files:
   ```
   data/raw/eeg/  → *.edf files
   data/raw/mri/  → *.nii.gz files
   ```

3. Create manifest (data/metadata/dataset_manifest.csv):
   ```csv
   subject_id,dataset,label,eeg_path,mri_path,fmri_path,ct_path,age,sex
   COBRE_0001,COBRE,0,data/raw/eeg/COBRE_0001.edf,data/raw/mri/COBRE_0001.nii.gz,,,35,M
   COBRE_0002,COBRE,1,data/raw/eeg/COBRE_0002.edf,data/raw/mri/COBRE_0002.nii.gz,,,38,F
   ```

4. Train:
   ```bash
   python scripts/train.py --modality multimodal --epochs 50
   ```

---

## Key Commands

| Task | Command |
|------|---------|
| Check setup | `python scripts/setup_environment.py` |
| Validate data | `python scripts/validate_dataset.py` |
| Train EEG | `python scripts/train.py --modality eeg` |
| Train MRI | `python scripts/train.py --modality imaging` |
| Train Multimodal | `python scripts/train.py --modality multimodal` |
| Run tests | `python -m pytest tests/ -v` |
| Streamlit app | `streamlit run app/streamlit_app.py` |
| Format code | `python -m black src/ models/ scripts/` |

---

## Project Status

- ✅ Core architecture implemented
- ✅ EEG preprocessing pipeline
- ✅ Neuroimaging preprocessing (MRI/fMRI/CT)
- ✅ Deep learning models (CNN, BiLSTM, Transformer)
- ✅ Multimodal fusion (Early/Late/Attention)
- ✅ Training pipeline with synthetic data
- ✅ Evaluation metrics
- ✅ Explainability modules (Grad-CAM, Saliency)
- ✅ Streamlit web application
- ✅ Unit tests
- ⏳ Real dataset integration (requires external data)
- ⏳ Advanced explainability (Captum integration)

---

## Next Steps

1. **Obtain dataset** (COBRE, SchizConnect, OpenNeuro)
2. **Organize data** in proper directory structure
3. **Update manifest** with file paths
4. **Validate dataset** with `scripts/validate_dataset.py`
5. **Train models** with real data
6. **Evaluate results** via Streamlit app
7. **Publish results** with proper disclaimers

---

## Important Notes

🚨 **THIS IS NOT A CLINICAL TOOL**

Results must NOT be used as standalone diagnosis. Always consult medical professionals.

⚠️ **SYNTHETIC DATA MODE**

Current training uses synthetic data for demonstration. Real model performance requires real datasets.

📊 **RESEARCH ONLY**

This project is for academic research purposes only.

---

For full documentation, see [README.md](README.md)
"""
