"""COMPLETE PROJECT FILE INDEX

# Schizophrenia Detection - File Directory

Last Generated: 2024
Total Files: 60+
Project Version: 0.1.0

---

## ROOT DIRECTORY FILES

### Documentation & Setup
- **README.md** - Complete project guide with installation and usage
- **QUICKSTART.md** - 5-minute quick start guide
- **PROJECT_COMPLETION.md** - Comprehensive project completion summary
- **requirements.txt** - Python package dependencies
- **.env.example** - Environment variables template
- **.gitignore** - Git version control exclusions
- **setup_windows.bat** - Automated Windows setup script
- **setup_unix.sh** - Automated Linux/Mac setup script
- **__init__.py** - Project package initialization

### Configuration Files
- **.vscode/settings.json** - VS Code editor configuration
- **.vscode/launch.json** - VS Code debug configurations (5 profiles)
- **.vscode/tasks.json** - VS Code automated tasks (12 tasks)

---

## CONFIGURATION DIRECTORY (config/)

YAML configuration files - modify these for different experiments

1. **config/config.yaml**
   - Global project configuration
   - Paths, batch size, learning rate, training parameters
   - Device selection (cuda/cpu/auto)
   - Loss function and optimizer choices

2. **config/eeg_config.yaml**
   - EEG-specific preprocessing parameters
   - Sampling frequency (256 Hz)
   - Filter ranges (0.5-45 Hz bandpass, 50 Hz notch)
   - Frequency bands (delta, theta, alpha, beta, gamma, high_gamma)
   - Feature extraction methods
   - Channel configuration (10-20 system)

3. **config/imaging_config.yaml**
   - MRI/fMRI/CT preprocessing parameters
   - Target image size (96×96×96)
   - Normalization methods
   - Resampling interpolation
   - ROI atlas selection (AAL90, AAL116, etc.)
   - CT windowing parameters

4. **config/model_config.yaml**
   - EEG model definitions (CNN, BiLSTM, Transformer)
   - Imaging model definitions (3D-CNN, ResNet)
   - Fusion model definitions
   - Experiment configurations

---

## SOURCE CODE DIRECTORY (src/)

### src/utils/ - Utility Functions (6 files)

**Core Infrastructure:**
1. **src/utils/__init__.py** - Package initialization
2. **src/utils/device.py** - GPU/CPU management
   - get_device() - Auto-detect CUDA or default to CPU
   - get_device_info() - Detailed device information

3. **src/utils/logger.py** - Centralized logging
   - setup_logging() - Configure console + file logging
   - get_logger() - Get logger for module

4. **src/utils/seed.py** - Reproducibility
   - set_seed() - Set seeds for random, numpy, torch

5. **src/utils/file_utils.py** - File I/O
   - create_directories() - Create paths if missing
   - load_json() / save_json() - JSON file operations
   - get_relative_path() - Get path relative to project root

6. **src/utils/config_loader.py** - Configuration loading
   - ConfigLoader class for hierarchical YAML loading
   - get_nested() for accessing nested config values

7. **src/utils/synthetic_data.py** - Test data generation
   - SyntheticDataGenerator class
   - generate_eeg_tensor() - EEG with oscillations
   - generate_mri_tensor() - MRI with Gaussian noise
   - generate_fmri_tensor() - fMRI connectivity matrices
   - generate_ct_tensor() - CT with Hounsfield units
   - All labeled as "SYNTHETIC TEST DATA"

### src/preprocessing/ - Data Preprocessing (5 files)

**Preprocessing Modules:**
1. **src/preprocessing/__init__.py** - Package initialization
2. **src/preprocessing/common.py** - Shared utilities
   - normalize_tensor() - Min-max, z-score, robust scaling
   - resample_volume() - 3D volume resampling
   - pad_or_crop() - Adjust to target shape

3. **src/preprocessing/eeg.py - EEGPreprocessor**
   - load_eeg_file() - Supports .edf, .fif, .set, .bdf, .vhdr, .csv, .tsv
   - apply_bandpass_filter() - 0.5-45 Hz (configurable)
   - apply_notch_filter() - Remove 50/60 Hz powerline
   - resample() - Resample to target frequency
   - normalize() - Z-score or min-max per channel
   - preprocess_pipeline() - Full EEG pipeline

4. **src/preprocessing/mri.py - MRIPreprocessor**
   - load_nifti() - Load .nii / .nii.gz files
   - load_dcm() - Load single DICOM file
   - normalize_intensity() - Voxel intensity normalization
   - resample_volume() - Resample to 96×96×96
   - preprocess_pipeline() - Full MRI pipeline

5. **src/preprocessing/fmri.py - fMRIPreprocessor**
   - load_nifti() - Load 4D fMRI time series
   - extract_roi_timeseries() - Extract ROI signals
   - compute_connectivity_matrix() - Correlation/covariance
   - normalize_intensity() - Temporal normalization
   - preprocess_pipeline() - Full fMRI pipeline

6. **src/preprocessing/ct.py - CTPreprocessor**
   - load_dcm_series() - Load DICOM series
   - load_nifti() - Load CT as NIfTI
   - apply_windowing() - Brain window (HU 40±80)
   - normalize_hu() - Normalize Hounsfield units
   - resample_volume() - Resample volume
   - preprocess_pipeline() - Full CT pipeline

### src/datasets/ - Dataset Classes (6 files)

**Dataset Loading:**
1. **src/datasets/__init__.py** - Package initialization
2. **src/datasets/base_dataset.py - BaseDataset**
   - Abstract base class for all datasets
   - __getitem__() - Return sample dict
   - get_class_distribution() - Class balance check
   - get_class_weights() - Weighted loss computation
   - create_subject_splits() - Subject-level train/val/test split

3. **src/datasets/eeg_dataset.py - EEGDataset(BaseDataset)**
   - Load EEG files with synthetic fallback
   - Output: {"eeg": (19, timepoints), "label": long, "subject_id": str}
   - Handles missing files gracefully

4. **src/datasets/mri_dataset.py - MRIDataset(BaseDataset)**
   - Load MRI volumes, resample to 96×96×96
   - Output: {"mri": (1, 96, 96, 96), "label": long, "subject_id": str}

5. **src/datasets/fmri_dataset.py - fMRIDataset(BaseDataset)**
   - Load fMRI, compute connectivity matrices
   - Output: {"fmri": (90, 90), "label": long, "subject_id": str}

6. **src/datasets/ct_dataset.py - CTDataset(BaseDataset)**
   - Load CT volumes, resample to 96×96×96
   - Output: {"ct": (1, 96, 96, 96), "label": long, "subject_id": str}

7. **src/datasets/multimodal_dataset.py - MultimodalDataset(BaseDataset)**
   - Combine multiple modality datasets
   - Output: {"eeg": ?, "mri": ?, "fmri": ?, "ct": ?, "label": long}
   - Graceful handling of missing modalities

### src/feature_extraction/ - Feature Extraction (5 files)

**Feature Computation:**
1. **src/feature_extraction/__init__.py** - Package initialization
2. **src/feature_extraction/eeg_features.py - EEGFeatureExtractor**
   - extract_time_domain_features() - Mean, std, RMS, skewness, kurtosis
   - extract_hjorth_parameters() - Activity, mobility, complexity

3. **src/feature_extraction/spectral_features.py - SpectralAnalyzer**
   - compute_band_power() - Power in delta/theta/alpha/beta/gamma
   - compute_relative_band_power() - Normalized band power

4. **src/feature_extraction/time_frequency.py - TimeFrequencyAnalyzer**
   - compute_wavelet_transform() - Morlet wavelet decomposition
   - compute_stft() - Short-time Fourier transform
   - compute_spectrogram() - Power spectrogram

5. **src/feature_extraction/connectivity.py - ConnectivityAnalyzer**
   - compute_correlation_matrix() - Pearson correlation
   - compute_coherence_matrix() - Cross-frequency coherence
   - compute_plv() - Phase locking value

6. **src/feature_extraction/imaging_features.py - ImagingFeatureExtractor**
   - extract_volumetric_features() - Mean, std, median intensity

### src/training/ - Training Pipeline (3 files)

**Training Infrastructure:**
1. **src/training/__init__.py** - Package initialization
2. **src/training/losses.py** - Loss functions
   - FocalLoss - Handles class imbalance (α=0.25, γ=2.0)
   - WeightedCrossEntropyLoss - Weighted classification

3. **src/training/callbacks.py** - Training callbacks
   - EarlyStoppingCallback - Stop if no improvement
   - CheckpointCallback - Save best model

4. **src/training/trainer.py - Trainer**
   - train_epoch() - Single training epoch
   - validate() - Validation epoch
   - train() - Full training loop with early stopping
   - save_checkpoint() / load_checkpoint() - Model persistence

### src/evaluation/ - Evaluation Metrics (3 files)

**Evaluation Framework:**
1. **src/evaluation/__init__.py** - Package initialization
2. **src/evaluation/metrics.py - Metrics**
   - compute_metrics() - Accuracy, precision, recall, F1, sensitivity, specificity
   - compute_roc_auc() - ROC-AUC score
   - get_confusion_matrix() - Confusion matrix computation

3. **src/evaluation/confusion_matrix.py - ConfusionMatrixGenerator**
   - plot_confusion_matrix() - Seaborn heatmap visualization

4. **src/evaluation/statistical_tests.py - StatisticalAnalysis**
   - perform_ttest() - Parametric t-test
   - perform_mannwhitneyu() - Non-parametric Mann-Whitney U
   - mcnemar_test() - Paired classifier comparison

### src/explainability/ - Explainability Framework (5 files)

**Model Interpretability:**
1. **src/explainability/__init__.py** - Package initialization
2. **src/explainability/eeg_explainability.py - EEGExplainability**
   - get_channel_importance() - Channel importance via input gradients
   - plot_channel_importance() - Bar chart visualization

3. **src/explainability/gradcam.py - GradCAM**
   - generate_cam() - Class activation maps for 3D volumes
   - Hooks for activations and gradients
   - Normalized output [0, 1]

4. **src/explainability/saliency.py - SaliencyMaps**
   - compute_saliency() - Input gradient-based attribution
   - Normalized to [0, 1]

5. **src/explainability/attention_maps.py - AttentionMapper**
   - get_attention_weights() - Extract attention from Transformer layers

6. **src/explainability/connectivity_maps.py - ConnectivityVisualizer**
   - plot_connectivity_matrix() - Heatmap of ROI connectivity
   - plot_connectivity_network() - NetworkX graph visualization

---

## MODELS DIRECTORY (models/)

### models/eeg/ - EEG Models (3 files)

**EEG-Specific Architectures:**
1. **models/eeg/__init__.py** - Package initialization
2. **models/eeg/cnn.py - EEG1DCNN**
   - 3 Conv1D blocks (16→32→64 filters)
   - Kernel size: 5, Pool: 2, Dropout: 0.5
   - Output: (batch, 2) logits + (batch, 128) embeddings
   - Input: (batch, 19, timepoints)

3. **models/eeg/bilstm.py - EEGCNNBiLSTM**
   - Conv1D (32 filters) + BiLSTM (128 hidden, 2 layers)
   - Captures local + temporal features
   - Output: (batch, 2) logits + (batch, 256) embeddings

4. **models/eeg/transformer.py - EEGTransformer**
   - Patch embedding (10 timepoints)
   - TransformerEncoder (4 heads, 3 layers, 64D)
   - Output: (batch, 2) logits + (batch, 128) embeddings

### models/imaging/ - Imaging Models (2 files)

**3D Imaging Architectures:**
1. **models/imaging/__init__.py** - Package initialization
2. **models/imaging/cnn3d.py - Imaging3DCNN**
   - 4 Conv3D blocks (8→16→32→64 filters)
   - Kernel: 3, Pool: 2, Dropout: 0.5
   - Output: (batch, 2) logits + (batch, 64) embeddings
   - Input: (batch, 1, 96, 96, 96)

3. **models/imaging/resnet3d.py - Imaging3DResNet**
   - Residual 3D networks (18/34/50/101)
   - 4 residual layers with skip connections
   - Output: (batch, 2) logits + (batch, 512) embeddings

### models/fusion/ - Fusion Models (3 files + __init__.py with classes)

**Multimodal Fusion Strategies:**
1. **models/fusion/__init__.py** - Contains all fusion classes
2. **EarlyFusion**
   - Concatenate modality embeddings → FC layers
   - Simple but requires all modalities
   
3. **LateFusion**
   - Modality-specific classifiers → Fusion head
   - Handles missing modalities

4. **AttentionFusion**
   - Project embeddings → Attention encoder → FC
   - Learnable cross-modal weights

---

## APPLICATION DIRECTORY (app/)

### Streamlit Web Interface
1. **app/__init__.py** - Package initialization
2. **app/streamlit_app.py** - Main Streamlit application
   - 5 pages: Home, EEG Analysis, Neuroimaging, Multimodal, Results
   - File upload support
   - Synthetic test mode
   - Metric dashboards
   - "Research prototype" disclaimer on every page

---

## SCRIPTS DIRECTORY (scripts/)

### Standalone Python Scripts
1. **scripts/setup_environment.py**
   - Validate Python version
   - Check all dependencies
   - Verify CUDA availability
   - Print setup summary

2. **scripts/validate_dataset.py**
   - Check data directory structure
   - Count EEG/MRI/fMRI/CT files
   - Validate metadata manifest
   - Display dataset statistics

3. **scripts/create_splits.py**
   - Generate train/val/test splits
   - Subject-level splitting (no data leakage)
   - Output CSV files in data/splits/

4. **scripts/train.py**
   - Training script for all modalities
   - Arguments: --modality {eeg,imaging,multimodal}, --epochs, --batch-size, --lr
   - Uses synthetic data (switchable to real data)
   - Saves checkpoints to models/checkpoints/

5. **scripts/inference.py**
   - Inference on new data
   - Load trained models and run predictions
   - Display predictions with confidence scores
   - Output explanation visualizations

---

## TESTING DIRECTORY (tests/)

### Unit Tests
1. **tests/__init__.py** - Package initialization
2. **tests/test_models.py** - Model tests
   - TestSyntheticData - EEG/MRI generation
   - TestModels - Model instantiation and forward passes
   - TestUtilities - Seed setting and device detection

3. **tests/test_preprocessing.py** - Preprocessing tests
   - TestEEGPreprocessing - EEG filtering and normalization
   - TestMRIPreprocessing - MRI resampling
   - [Additional preprocessing test cases]

---

## DOCUMENTATION DIRECTORY (docs/)

### Comprehensive Guides
1. **docs/ARCHITECTURE.md** - System architecture
   - High-level architecture diagrams
   - Module breakdown
   - Data flow examples
   - Design patterns
   - Dependency graph

2. **docs/PREPROCESSING.md** - Preprocessing guide
   - EEG preprocessing steps
   - MRI preprocessing steps
   - fMRI preprocessing steps
   - CT preprocessing steps
   - Complete code examples

3. **docs/DATASET_GUIDE.md** - Dataset integration
   - Supported public datasets (COBRE, SchizConnect, OpenNeuro)
   - Manifest file format
   - Step-by-step integration
   - Data validation checklist
   - Troubleshooting guide

---

## DATA DIRECTORY (data/)

### Data Organization Structure
```
data/
├── raw/
│   ├── eeg/          (Place .edf, .fif, .set files here)
│   ├── mri/          (Place .nii.gz files here)
│   ├── fmri/         (Place fMRI .nii.gz files here)
│   └── ct/           (Place .dcm or .nii.gz files here)
├── processed/        (Preprocessed data after running pipeline)
│   ├── eeg/
│   ├── mri/
│   ├── fmri/
│   └── ct/
├── metadata/
│   └── dataset_manifest.csv  (Subject information and file paths)
└── splits/
    ├── train.csv     (Training subjects)
    ├── validation.csv (Validation subjects)
    └── test.csv      (Test subjects)
```

---

## RESULTS DIRECTORY (results/)

### Output Directories
```
results/
├── figures/          (Generated visualizations)
│   ├── confusion_matrix.png
│   ├── channel_importance.png
│   ├── connectivity_matrix.png
│   └── ...
├── metrics/          (Performance metrics)
│   ├── train_metrics.json
│   ├── val_metrics.json
│   └── test_metrics.json
├── predictions/      (Model predictions)
│   ├── predictions.csv
│   └── probabilities.npy
├── reports/          (Research reports)
│   └── experiment_report.md
└── logs/            (Training logs)
    └── training.log
```

---

## TOP-LEVEL CONFIGURATION FILES

1. **.env.example** - Environment variables template
   - Flask settings
   - Model paths
   - Data directories
   - Logging configuration
   - CUDA settings

2. **.gitignore** - Version control exclusions
   - __pycache__/, .pytest_cache/
   - Virtual environments (.venv/)
   - Data files (*.nii.gz, *.dcm, *.edf)
   - Results and logs
   - IDE configurations

3. **setup_windows.bat** - Windows setup automation
   - Check Python version
   - Create virtual environment
   - Install dependencies
   - Validate setup

4. **setup_unix.sh** - Linux/Mac setup automation
   - Same as Windows but for Unix systems
   - Use: bash setup_unix.sh

---

## SUMMARY BY FILE TYPE

### Python Files (55+)
- Core modules: 30 files
- Scripts: 5 files
- Tests: 2 files
- Configuration: 1 file
- Package init: 12 files

### YAML Configuration (4)
- config/config.yaml
- config/eeg_config.yaml
- config/imaging_config.yaml
- config/model_config.yaml

### Documentation (6)
- README.md
- QUICKSTART.md
- PROJECT_COMPLETION.md
- docs/ARCHITECTURE.md
- docs/PREPROCESSING.md
- docs/DATASET_GUIDE.md

### Setup & Config (7)
- setup_windows.bat
- setup_unix.sh
- .vscode/settings.json
- .vscode/launch.json
- .vscode/tasks.json
- .gitignore
- .env.example

### Data & Results (2 templates)
- data/metadata/dataset_manifest.csv
- results/ (directory structure)

---

## FILE NAVIGATION SHORTCUTS

### To run the app:
→ app/streamlit_app.py

### To train a model:
→ scripts/train.py

### To validate datasets:
→ scripts/validate_dataset.py

### To configure parameters:
→ config/config.yaml

### To understand architecture:
→ docs/ARCHITECTURE.md

### To integrate datasets:
→ docs/DATASET_GUIDE.md

### To explore EEG models:
→ models/eeg/

### To explore imaging models:
→ models/imaging/

### To see preprocessing code:
→ src/preprocessing/

### To see dataset classes:
→ src/datasets/

### To see evaluation metrics:
→ src/evaluation/

### To see explainability:
→ src/explainability/

---

**Total Files:** 60+
**Total Lines of Code:** 8,000+
**Configuration Files:** 4 YAML + 7 supporting
**Documentation Pages:** 6 markdown files
**All Files:** Type-hinted and fully documented

Last Updated: 2024
"""
