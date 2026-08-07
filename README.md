# Multimodal Schizophrenia Classification Pipeline

A complete runnable PyTorch pipeline for binary classification of schizophrenia vs healthy control using multimodal fusion of EEG time-series and structural neuroimaging.

## Project Structure

- `dataset.py` — Data collection and dataset logic for EEG and imaging.
- `preprocess_eeg.py` — EEG preprocessing utilities: bandpass, artifact rejection, normalization, spectrogram.
- `preprocess_imaging.py` — Imaging preprocessing utilities: skull strip placeholder, resample, intensity normalization.
- `models.py` — EEG and imaging feature extractors, fusion module, classifier head, full model wrapper.
- `train.py` — Training script with stratified split, weighted loss, metrics, checkpointing.
- `predict.py` — Inference script for saved checkpoints.
- `requirements.txt` — Python dependencies.

## Data Layout

Place your dataset under a root folder with the structure below:

```
data/
  eeg/{subject_id}.edf
  imaging/{subject_id}.nii.gz
  labels.csv
```

The `labels.csv` file must contain:

- `subject_id`
- `label` (0 = Healthy, 1 = Schizophrenia)

This pipeline is compatible with public multimodal datasets such as COBRE, SchizConnect, and OpenNeuro, as long as you map files into the expected structure.

## Installation

Create a Python environment and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate   # macOS/Linux
.venv\Scripts\activate.bat  # Windows
pip install -r requirements.txt
```

## Training

Train using real data:

```bash
python train.py --data_dir data --labels_csv data/labels.csv --batch_size 8 --epochs 20 --fusion_type concat --imaging_backbone cnn3d --classifier_type mlp
```

Train on dummy data to verify the pipeline without real files:

```bash
python train.py --dummy --epochs 2 --batch_size 4
```

## Inference

Run inference with a saved checkpoint:

```bash
python predict.py --checkpoint outputs/best_model.pth --eeg_path data/eeg/001.edf --image_path data/imaging/001.nii.gz
```

Run inference on dummy input:

```bash
python predict.py --checkpoint outputs/best_model.pth --dummy
```

## Notes & Configuration

- `dataset.py` automatically detects `.edf`, `.set`, `.csv` EEG files and `.nii` / `.nii.gz` imaging volumes.
- EEG preprocessing supports optional spectrogram conversion via `use_spectrogram` in `MultimodalSZDataset`.
- Imaging preprocessing includes a placeholder skull stripping stage using `nilearn.masking.compute_brain_mask` and resampling to a fixed shape.
- `models.py` supports:
  - EEG feature extraction with 1D CNN + Bi-LSTM
  - Imaging backbone choice: `cnn3d` or `vit3d`
  - Fusion strategy: `concat` or `cross_attention`
  - Classifier choice: `mlp` or `transformer`

## How to adapt to COBRE / SchizConnect / OpenNeuro

1. Download EEG and imaging files.
2. Place them into `data/eeg/` and `data/imaging/` using consistent subject IDs.
3. Create `data/labels.csv` with `subject_id,label` rows.
4. Update `train.py` flags as needed for backbone, fusion, and classifier.

## Verifying the Architecture

To confirm the model runs end-to-end with random inputs:

```bash
python train.py --dummy --epochs 1 --batch_size 2
```

This will exercise the full dataset loader, feature extraction, fusion, classifier, and training loop.
