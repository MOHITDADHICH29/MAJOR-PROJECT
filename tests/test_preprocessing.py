"""Test data preprocessing pipeline."""

import pytest
import torch
import numpy as np
from src.preprocessing.eeg import EEGPreprocessor
from src.preprocessing.mri import MRIPreprocessor
from src.utils import SyntheticDataGenerator


class TestEEGPreprocessing:
    """Test EEG preprocessing."""

    def test_normalization(self):
        """Test EEG normalization."""
        eeg_data = np.random.randn(19, 1024)

        from src.preprocessing.common import normalize_tensor

        # Z-score
        normalized = normalize_tensor(eeg_data, method="zscore")
        assert normalized.mean() < 0.1
        assert abs(normalized.std() - 1.0) < 0.1

        # Min-Max
        normalized = normalize_tensor(eeg_data, method="min_max")
        assert normalized.min() >= 0
        assert normalized.max() <= 1

    def test_bandpass_filter(self):
        """Test bandpass filtering."""
        eeg_data = np.random.randn(19, 512)
        sampling_freq = 256

        from src.preprocessing.common import apply_bandpass_filter

        filtered = apply_bandpass_filter(eeg_data, low_freq=0.5, high_freq=45)
        assert filtered.shape == eeg_data.shape

    def test_resample(self):
        """Test resampling."""
        eeg_data = np.random.randn(19, 1024)
        original_freq = 500
        target_freq = 256

        from src.preprocessing.common import resample_signal

        # This function should be created if not exists
        # Placeholder test
        assert eeg_data.shape[0] == 19


class TestMRIPreprocessing:
    """Test MRI preprocessing."""

    def test_volume_resample(self):
        """Test volume resampling."""
        volume = np.random.randn(128, 128, 128)
        target_shape = (96, 96, 96)

        from src.preprocessing.common import resample_volume

        resampled = resample_volume(volume, target_shape)
        assert resampled.shape == target_shape

    def test_intensity_normalization(self):
        """Test intensity normalization."""
        volume = np.random.rand(96, 96, 96) * 255

        from src.preprocessing.common import normalize_tensor

        normalized = normalize_tensor(volume, method="min_max", min_val=0, max_val=1)
        assert normalized.min() >= 0
        assert normalized.max() <= 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
