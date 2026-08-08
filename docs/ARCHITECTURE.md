"""System Architecture Documentation

## High-Level Architecture

```
Input Data
    ├─ EEG (time-series)
    ├─ MRI (3D volume)
    ├─ fMRI (4D timeseries)
    └─ CT (3D volume)
           ↓
      Preprocessing
    ├─ Filtering & cleaning
    ├─ Normalization
    └─ Resampling
           ↓
     Feature Extraction
    ├─ Time-domain features
    ├─ Frequency-domain features
    ├─ Connectivity matrices
    └─ Spectral features
           ↓
    Deep Learning Models
    ├─ EEG: CNN/BiLSTM/Transformer
    ├─ MRI: 3D-CNN/ResNet
    └─ Outputs: Embeddings (128-D)
           ↓
    Multimodal Fusion
    ├─ Early Fusion: Concatenate embeddings
    ├─ Late Fusion: Merge predictions
    └─ Attention: Cross-modal attention
           ↓
    Classification Head
           ↓
    Output: {class, confidence, explanation}
```

## Module Breakdown

### 1. Preprocessing (`src/preprocessing/`)

#### EEG Preprocessing
- Load various formats (EDF, FIF, CSV, EEGLAB)
- Bandpass filtering (0.5-45 Hz)
- Notch filtering (50/60 Hz)
- Artifact removal (z-score, ICA)
- Normalization (z-score, min-max)

#### Imaging Preprocessing
- MRI: Intensity normalization, resampling
- fMRI: Temporal filtering, ROI extraction, connectivity
- CT: Windowing, HU normalization, resampling

### 2. Datasets (`src/datasets/`)

- **BaseDataset**: Abstract base class with split utilities
- **EEGDataset**: Loads EEG files or synthetic data
- **MRIDataset**: Loads MRI volumes, handles resampling
- **fMRIDataset**: Loads fMRI, computes connectivity
- **CTDataset**: Loads CT volumes
- **MultimodalDataset**: Combines multiple modalities

### 3. Feature Extraction (`src/feature_extraction/`)

- **EEGFeatureExtractor**: Time-domain, Hjorth, spectral
- **SpectralAnalyzer**: Band power, relative power
- **TimeFrequencyAnalyzer**: Wavelet, spectrogram
- **ConnectivityAnalyzer**: Correlation, coherence, PLV
- **ImagingFeatureExtractor**: Volumetric statistics

### 4. Models (`models/`)

#### EEG Models
```python
EEG1DCNN:
  Conv1D layers → MaxPool → Global pooling → FC
  Output: (batch, 2) logits + (batch, 128) embeddings

EEGCNNBiLSTM:
  Conv1D → Transpose → BiLSTM → FC
  Output: (batch, 2) logits + (batch, 128) embeddings

EEGTransformer:
  Patch embedding → Transformer encoder → FC
  Output: (batch, 2) logits + (batch, 128) embeddings
```

#### Imaging Models
```python
Imaging3DCNN:
  Conv3D layers → MaxPool → Global pooling → FC
  Output: (batch, 2) logits + (batch, 64) embeddings

Imaging3DResNet:
  Conv3D → ResidualBlocks × 4 → Global pooling → FC
  Output: (batch, 2) logits + (batch, 512) embeddings
```

#### Fusion Models
```python
EarlyFusion:
  Concatenate embeddings → FC layers → Output

LateFusion:
  Modality-specific classifiers → Fusion head → Output

AttentionFusion:
  Project embeddings → Attention encoder → FC → Output
```

### 5. Training (`src/training/`)

- **Trainer**: Main training loop with validation
- **FocalLoss**: Handles class imbalance
- **WeightedCrossEntropyLoss**: Weighted classification
- **Callbacks**: Early stopping, checkpointing

### 6. Evaluation (`src/evaluation/`)

- **Metrics**: Accuracy, Precision, Recall, F1, ROC-AUC
- **ConfusionMatrixGenerator**: Visualization
- **StatisticalAnalysis**: t-test, Mann-Whitney U, McNemar

### 7. Explainability (`src/explainability/`)

- **EEGExplainability**: Channel importance via gradients
- **GradCAM**: 3D activation maps
- **SaliencyMaps**: Input sensitivity
- **AttentionMapper**: Attention visualization
- **ConnectivityVisualizer**: Network graphs

### 8. Utilities (`src/utils/`)

- **device.py**: GPU/CPU management
- **logger.py**: Logging configuration
- **seed.py**: Random seed control
- **file_utils.py**: File I/O helpers
- **config_loader.py**: YAML configuration
- **synthetic_data.py**: Test data generation

## Data Flow Example

### Training a Multimodal Model

```python
# 1. Load configuration
config = ConfigLoader("config").load_all_configs()

# 2. Generate/load data
batch = SyntheticDataGenerator.generate_multimodal_batch(
    modalities=["eeg", "mri"]
)

# 3. Create datasets
eeg_dataset = EEGDataset(data_list, config["eeg"])
mri_dataset = MRIDataset(data_list, config["imaging"])
multimodal_dataset = MultimodalDataset(
    data_list,
    modalities=["eeg", "mri"]
)

# 4. Create data loaders
train_loader = DataLoader(
    multimodal_dataset,
    batch_size=16,
    shuffle=True
)

# 5. Initialize models
eeg_model = EEG1DCNN(input_channels=19, output_dim=128)
mri_model = Imaging3DCNN(input_channels=1, output_dim=128)
fusion_model = LateFusion(
    embedding_dims={"eeg": 128, "mri": 128},
    num_classes=2
)

# 6. Training loop
trainer = Trainer(
    fusion_model,
    train_loader,
    val_loader,
    criterion=FocalLoss(),
    optimizer=torch.optim.AdamW(fusion_model.parameters()),
    device=device
)
history = trainer.train(num_epochs=50)

# 7. Evaluation
predictions = model(test_batch)
metrics = Metrics.compute_metrics(predictions, ground_truth)
cm = ConfusionMatrixGenerator.plot_confusion_matrix(...)
```

## Processing Pipeline Example

### EEG Analysis
```python
# Load
preprocessor = EEGPreprocessor(config["eeg"])
eeg_data, fs = preprocessor.load_eeg_file("data/raw/eeg/subject_001.edf")

# Preprocess
eeg_clean = preprocessor.preprocess_pipeline(
    eeg_data,
    apply_bandpass=True,
    apply_notch=True,
    apply_normalization=True
)

# Extract features
eeg_extractor = EEGFeatureExtractor()
time_features = eeg_extractor.extract_time_domain_features(eeg_clean)
spectral_features = eeg_extractor.extract_spectral_features(eeg_clean, fs)

# Model
model = EEG1DCNN(...)
logits, embeddings = model(torch.FloatTensor(eeg_clean))

# Explain
channel_importance = EEGExplainability.get_channel_importance(model, eeg_clean)
```

### MRI Analysis
```python
# Load
preprocessor = MRIPreprocessor(config["imaging"])
mri_data, metadata = preprocessor.load_nifti("data/raw/mri/subject_001.nii.gz")

# Preprocess
mri_processed = preprocessor.preprocess_pipeline(
    mri_data,
    apply_normalization=True,
    apply_resampling=True
)

# Model
model = Imaging3DResNet(depth=18)
logits, embeddings = model(torch.FloatTensor(mri_processed).unsqueeze(0).unsqueeze(0))

# Explain
grad_cam = GradCAM(model, model.layer4[-1])
heatmap = grad_cam.generate_cam(mri_tensor)
```

## Performance Characteristics

| Component | Input | Output | Runtime (GPU) |
|-----------|-------|--------|---------------|
| EEG CNN | (B, 19, 1024) | (B, 2) | ~10ms |
| EEG BiLSTM | (B, 19, 1024) | (B, 2) | ~20ms |
| MRI 3D-CNN | (B, 1, 96, 96, 96) | (B, 2) | ~30ms |
| MRI ResNet | (B, 1, 96, 96, 96) | (B, 2) | ~25ms |
| Fusion (Early) | 2 embeddings | (B, 2) | ~5ms |
| Fusion (Late) | 2 embeddings | (B, 2) | ~10ms |
| Fusion (Attention) | 2 embeddings | (B, 2) | ~15ms |

## Design Patterns

### Modular Architecture
- Each modality has independent preprocessing and models
- Fusion modules are interchangeable
- Easy to add new modalities or fusion strategies

### Separation of Concerns
- Preprocessing: Data cleaning and preparation
- Datasets: Data loading and batching
- Models: Architectural definitions
- Training: Training loop logic
- Evaluation: Metric computation

### Factory Pattern
- ConfigLoader creates configs from YAML
- SyntheticDataGenerator creates test data
- Model registration for easy selection

### Strategy Pattern
- Multiple fusion strategies (Early, Late, Attention)
- Multiple preprocessing strategies per modality
- Multiple normalization methods

## Extensibility

### Adding a New Modality (PET Example)
```python
# 1. Create preprocessor
class PETPreprocessor:
    def preprocess_pipeline(self, data):
        # PET-specific preprocessing
        pass

# 2. Create dataset
class PETDataset(BaseDataset):
    def __getitem__(self, idx):
        # Load PET data
        pass

# 3. Create model
class PETModel(nn.Module):
    def forward(self, x):
        # PET analysis
        pass

# 4. Update MultimodalDataset
class MultimodalDataset(BaseDataset):
    def __getitem__(self, idx):
        # Include PET
        sample["pet"] = self.pet_dataset[idx]["pet"]
```

### Adding a New Model
```python
# 1. Create model
class EEGGraphNN(nn.Module):
    def forward(self, x):
        # Graph neural network for EEG connectivity
        pass

# 2. Register in config
# config/model_config.yaml
eeg:
    graphnn:
        name: "EEG_GraphNN"
        gat_layers: 3
        hidden_dim: 128

# 3. Use in training
model = EEGGraphNN(...)
```

## Dependencies Graph

```
Base Layer:
  └─ utils/ (device, logger, seed, config)

Data Layer:
  ├─ preprocessing/ (depends on utils)
  └─ datasets/ (depends on preprocessing, utils)

Feature Layer:
  └─ feature_extraction/ (depends on datasets)

Model Layer:
  ├─ eeg/ (independent)
  ├─ imaging/ (independent)
  └─ fusion/ (depends on eeg, imaging)

Training Layer:
  ├─ training/ (depends on models)
  ├─ evaluation/ (independent)
  └─ explainability/ (depends on models)

Application Layer:
  ├─ scripts/ (depends on all above)
  ├─ app/ (depends on all above)
  └─ tests/ (depends on models, datasets)
```

---

**Document Version:** 0.1
**Last Updated:** 2024
"""
