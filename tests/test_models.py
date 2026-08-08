"""Sample test file."""

import pytest
import torch
import numpy as np
from src.utils import SyntheticDataGenerator, set_seed, get_device
from models.eeg import EEG1DCNN
from models.imaging import Imaging3DCNN


class TestSyntheticData:
    """Test synthetic data generation."""

    def test_eeg_generation(self):
        """Test EEG data generation."""
        eeg_data = SyntheticDataGenerator.generate_eeg_tensor(
            n_samples=2,
            n_channels=19,
            n_timepoints=512,
        )

        assert eeg_data.shape == (2, 19, 512)
        assert isinstance(eeg_data, torch.Tensor)
        assert eeg_data.dtype == torch.float32

    def test_mri_generation(self):
        """Test MRI data generation."""
        mri_data = SyntheticDataGenerator.generate_mri_tensor(
            n_samples=2,
            depth=96,
            height=96,
            width=96,
        )

        assert mri_data.shape == (2, 1, 96, 96, 96)
        assert isinstance(mri_data, torch.Tensor)

    def test_labels_generation(self):
        """Test labels generation."""
        labels = SyntheticDataGenerator.generate_labels(n_samples=10, n_classes=2)

        assert len(labels) == 10
        assert torch.max(labels) < 2
        assert torch.min(labels) >= 0


class TestModels:
    """Test model instantiation."""

    def test_eeg_cnn_creation(self):
        """Test EEG CNN model creation."""
        model = EEG1DCNN(input_channels=19, num_classes=2)

        eeg_data = torch.randn(2, 19, 512)
        logits, embeddings = model(eeg_data)

        assert logits.shape == (2, 2)
        assert embeddings.shape == (2, 128)

    def test_imaging_3dcnn_creation(self):
        """Test 3D CNN model creation."""
        model = Imaging3DCNN(input_channels=1, num_classes=2)

        img_data = torch.randn(2, 1, 96, 96, 96)
        logits, embeddings = model(img_data)

        assert logits.shape == (2, 2)
        assert embeddings.shape == (2, 64)

    def test_eeg_cnn_forward(self):
        """Test EEG CNN forward pass."""
        model = EEG1DCNN(input_channels=19)
        eeg_data = torch.randn(4, 19, 1024)

        with torch.no_grad():
            logits, embeddings = model(eeg_data)

        assert logits.shape == (4, 2)
        assert embeddings.shape == (4, 128)


class TestUtilities:
    """Test utility functions."""

    def test_set_seed(self):
        """Test seed setting."""
        set_seed(42)

        arr1 = np.random.randn(10)

        set_seed(42)
        arr2 = np.random.randn(10)

        np.testing.assert_array_equal(arr1, arr2)

    def test_get_device(self):
        """Test device detection."""
        from src.utils import get_device

        device = get_device()

        assert device.type in ["cuda", "cpu"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
