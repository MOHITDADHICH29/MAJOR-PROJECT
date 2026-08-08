"""Schizophrenia Detection - Preprocessing Guide

## EEG Preprocessing

### Supported Formats
- **EDF** (.edf): European Data Format
- **FIF** (.fif): Neuromag FIF format
- **EEGLAB** (.set): EEGLAB format
- **BDF** (.bdf): BioSemi format
- **BrainVision** (.vhdr, .eeg, .vmrk): BrainVision format
- **CSV/TSV** (.csv, .tsv): Generic tabular format

### Processing Steps

1. **Load**
   ```python
   from src.preprocessing.eeg import EEGPreprocessor
   
   preprocessor = EEGPreprocessor(config["eeg"])
   eeg_data, sampling_freq = preprocessor.load_eeg_file("file.edf")
   ```

2. **Filter**
   - Bandpass filter: 0.5-45 Hz (configurable)
   - Notch filter: 50 Hz (60 Hz in US) for powerline interference
   - Order: 5th order Butterworth (configurable)

3. **Artifact Removal**
   - Z-score method: Remove samples > 3σ
   - ICA (Independent Component Analysis)
   - Automatic or manual channel rejection

4. **Normalization**
   - Z-score: (x - μ) / σ per channel
   - Min-Max: (x - min) / (max - min)
   - Robust: (x - median) / IQR

5. **Output**
   - Shape: (n_channels, n_timepoints)
   - Sampling rate: 256 Hz (configurable)
   - Data type: float32

### Configuration

```yaml
eeg:
  sampling_frequency: 256
  low_frequency: 0.5
  high_frequency: 45
  notch_frequency: 50
  
  bands:
    delta: [0.5, 4]
    theta: [4, 8]
    alpha: [8, 12]
    beta: [12, 30]
    gamma: [30, 45]
```

---

## Structural MRI Preprocessing

### Supported Formats
- **NIfTI** (.nii, .nii.gz): Standard neuroimaging format
- **DICOM** (.dcm): Radiology standard

### Processing Steps

1. **Load**
   ```python
   from src.preprocessing.mri import MRIPreprocessor
   
   preprocessor = MRIPreprocessor(config["imaging"])
   mri_data, metadata = preprocessor.load_nifti("file.nii.gz")
   ```

2. **Orientation Handling**
   - Ensure RAS (Right-Anterior-Superior) orientation
   - Handle different acquisition planes

3. **Intensity Normalization**
   - Min-Max normalization: [0, 255]
   - Z-score normalization

4. **Resampling**
   - Target shape: 96×96×96 voxels
   - Interpolation: Linear (configurable)
   - Preserves spatial information

5. **Optional: Skull Stripping**
   - Remove non-brain tissue
   - Improves CNN feature learning

6. **Output**
   - Shape: (1, 96, 96, 96)
   - Data type: float32
   - Normalized to [0, 1]

### Configuration

```yaml
imaging:
  target_size: [96, 96, 96]
  normalization: "min_max"
  normalization_range: [0, 1]
  interpolation_order: 1
  
  skull_stripping: false
  brain_mask: false
```

---

## Functional MRI Preprocessing

### Processing Steps

1. **Load 4D fMRI**
   - Dimensions: (x, y, z, timepoints)
   - Temporal resolution: ~2 seconds per volume

2. **Temporal Preprocessing**
   - High-pass filtering: Remove slow drifts
   - Low-pass filtering: Remove high-frequency noise
   - Detrending: Linear detrending optional

3. **ROI Extraction**
   - Parcellation atlas (AAL90, AAL116, Power264, etc.)
   - Extract mean timeseries per ROI
   - Output: (n_rois, n_timepoints)

4. **Functional Connectivity**
   - Correlation matrix: Pearson correlation between ROI timeseries
   - Covariance matrix: Covariance between ROI timeseries
   - Partial correlation: Conditional correlation
   - Output: (n_rois, n_rois) connectivity matrix

5. **Output**
   - Connectivity matrix: (90, 90) for AAL90
   - Data type: float32
   - Range: [-1, 1] for correlation

### Configuration

```yaml
fmri:
  n_rois: 90
  atlas: "AAL90"  # Options: AAL90, AAL116, Power264, Schaefer400
  
  connectivity_method: "correlation"  # Options: correlation, covariance, partial
  
  temporal_filtering:
    high_pass_freq: 0.01
    low_pass_freq: 0.1
    detrending: false
```

---

## CT Preprocessing

### Processing Steps

1. **Load DICOM Series**
   ```python
   from src.preprocessing.ct import CTPreprocessor
   
   preprocessor = CTPreprocessor(config["imaging"])
   ct_data = preprocessor.load_dcm_series("directory/")
   ```

2. **Windowing**
   - Brain window: HU center=40, width=80
   - Bone window: HU center=400, width=2000
   - Default: Brain window for neuroimaging

3. **Hounsfield Unit (HU) Normalization**
   - Range: [-1000 (air), +1000 (bone), +3000 (metal)]
   - Normalize to [0, 1]: (HU - HU_min) / (HU_max - HU_min)

4. **Resampling**
   - Target shape: 96×96×96 voxels
   - Isotropic resampling

5. **Output**
   - Shape: (1, 96, 96, 96)
   - Data type: float32
   - Normalized to [0, 1]

### Configuration

```yaml
ct:
  target_size: [96, 96, 96]
  window_center: 40    # Brain window
  window_width: 80
  hu_min: -1000
  hu_max: 3000
```

---

## Preprocessing Pipeline Example

### Full EEG Processing

```python
from src.preprocessing.eeg import EEGPreprocessor
from src.utils import ConfigLoader
import torch

# Load config
config_loader = ConfigLoader("config")
eeg_config = config_loader.get_config("eeg_config")

# Initialize preprocessor
preprocessor = EEGPreprocessor(eeg_config)

# Process file
eeg_data, fs = preprocessor.load_eeg_file("data/raw/eeg/subject_001.edf")

# Full pipeline
eeg_clean = preprocessor.preprocess_pipeline(
    eeg_data,
    apply_bandpass=True,
    apply_notch=True,
    normalize=True,
    method="zscore"
)

# Convert to tensor
eeg_tensor = torch.FloatTensor(eeg_clean)
print(f"Output shape: {eeg_tensor.shape}")  # (19, ~256*duration)
```

### Full MRI Processing

```python
from src.preprocessing.mri import MRIPreprocessor
from src.utils import ConfigLoader
import torch

# Load config
config_loader = ConfigLoader("config")
imaging_config = config_loader.get_config("imaging_config")

# Initialize preprocessor
preprocessor = MRIPreprocessor(imaging_config)

# Process file
mri_data, affine = preprocessor.load_nifti("data/raw/mri/subject_001.nii.gz")

# Full pipeline
mri_processed = preprocessor.preprocess_pipeline(
    mri_data,
    apply_normalization=True,
    apply_resampling=True
)

# Convert to tensor
mri_tensor = torch.FloatTensor(mri_processed).unsqueeze(0)  # Add channel
print(f"Output shape: {mri_tensor.shape}")  # (1, 96, 96, 96)
```

---

## Error Handling

### Common Issues

1. **File not found**
   - Check file path is correct
   - Ensure file format is supported
   - Dataset fallback will generate synthetic data

2. **Shape mismatch**
   - Different channels than expected
   - Different temporal resolution
   - Preprocessing will resample/pad/crop

3. **NaN values**
   - Bad channels or corrupted data
   - Normalization step handles NaN with warnings
   - Affected channels marked for removal

4. **Memory error**
   - Large 3D volumes (>500MB)
   - Enable memory-efficient resampling
   - Process in batches

---

## Performance Tips

1. **EEG**: Resample to 256 Hz to reduce computation
2. **MRI**: Use linear interpolation for speed (vs cubic)
3. **fMRI**: Use fast correlation instead of partial correlation
4. **Batch Processing**: Process multiple subjects in parallel

---

**Document Version:** 0.1
**Last Updated:** 2024
"""
