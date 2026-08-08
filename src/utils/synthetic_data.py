"""Synthetic data generation for testing without real datasets."""

import numpy as np
import torch
from typing import Tuple, Union, Dict
import logging

logger = logging.getLogger(__name__)


class SyntheticDataGenerator:
    """Generate synthetic test data for development and testing."""

    DISCLAIMER = "⚠️  SYNTHETIC TEST DATA — NOT MEDICAL DATA"

    @staticmethod
    def generate_eeg_tensor(
        n_samples: int = 32,
        n_channels: int = 19,
        n_timepoints: int = 1024,
        sampling_freq: int = 256,
    ) -> torch.Tensor:
        """
        Generate synthetic EEG data.

        Args:
            n_samples: Number of samples (batch size).
            n_channels: Number of EEG channels (default: 19 for 10-20 system).
            n_timepoints: Number of timepoints.
            sampling_freq: Sampling frequency in Hz.

        Returns:
            torch.Tensor: Shape (n_samples, n_channels, n_timepoints).
        """
        logger.info(SyntheticDataGenerator.DISCLAIMER)

        # Generate random noise with realistic amplitude (~50 μV)
        eeg_data = np.random.randn(n_samples, n_channels, n_timepoints) * 50

        # Add some oscillatory components (simulating alpha, beta rhythms)
        time_array = np.arange(n_timepoints) / sampling_freq
        for i in range(n_samples):
            for j in range(n_channels):
                # Alpha oscillation (10 Hz)
                eeg_data[i, j] += 20 * np.sin(2 * np.pi * 10 * time_array)
                # Beta oscillation (20 Hz)
                eeg_data[i, j] += 15 * np.sin(2 * np.pi * 20 * time_array)

        return torch.FloatTensor(eeg_data)

    @staticmethod
    def generate_mri_tensor(
        n_samples: int = 8,
        depth: int = 96,
        height: int = 96,
        width: int = 96,
    ) -> torch.Tensor:
        """
        Generate synthetic 3D MRI data.

        Args:
            n_samples: Number of samples (batch size).
            depth: Depth dimension (axial slices).
            height: Height dimension.
            width: Width dimension.

        Returns:
            torch.Tensor: Shape (n_samples, 1, depth, height, width).
        """
        logger.info(SyntheticDataGenerator.DISCLAIMER)

        # Generate Gaussian blobs to simulate brain structures
        mri_data = np.random.randn(n_samples, 1, depth, height, width) * 100

        # Add some structured patterns
        for i in range(n_samples):
            # Simulate brain-like structure with Gaussian blur
            from scipy.ndimage import gaussian_filter

            mri_data[i] = gaussian_filter(mri_data[i], sigma=3)

        # Normalize to [0, 255]
        mri_data = np.clip(mri_data, 0, 255)

        return torch.FloatTensor(mri_data)

    @staticmethod
    def generate_fmri_tensor(
        n_samples: int = 8,
        n_rois: int = 90,
        n_timepoints: int = 100,
    ) -> Union[torch.Tensor, np.ndarray]:
        """
        Generate synthetic fMRI data (connectivity matrix or timeseries).

        Args:
            n_samples: Number of samples (batch size).
            n_rois: Number of regions of interest (ROIs).
            n_timepoints: Number of time points.

        Returns:
            Connectivity matrices: torch.Tensor shape (n_samples, n_rois, n_rois).
        """
        logger.info(SyntheticDataGenerator.DISCLAIMER)

        # Generate random timeseries
        timeseries = np.random.randn(n_samples, n_rois, n_timepoints)

        # Compute correlation matrices (connectivity)
        connectivity_matrices = []
        for i in range(n_samples):
            corr = np.corrcoef(timeseries[i])
            connectivity_matrices.append(corr)

        return torch.FloatTensor(np.array(connectivity_matrices))

    @staticmethod
    def generate_ct_tensor(
        n_samples: int = 8,
        depth: int = 96,
        height: int = 96,
        width: int = 96,
    ) -> torch.Tensor:
        """
        Generate synthetic CT data.

        Args:
            n_samples: Number of samples (batch size).
            depth: Depth dimension.
            height: Height dimension.
            width: Width dimension.

        Returns:
            torch.Tensor: Shape (n_samples, 1, depth, height, width).
        """
        logger.info(SyntheticDataGenerator.DISCLAIMER)

        # Generate Hounsfield units (typically -1000 to 3000 for CT)
        ct_data = np.random.randint(-1000, 3000, (n_samples, 1, depth, height, width))

        # Apply Gaussian smoothing for realism
        from scipy.ndimage import gaussian_filter

        for i in range(n_samples):
            ct_data[i] = gaussian_filter(ct_data[i].astype(float), sigma=2)

        # Normalize to [0, 1]
        ct_data = (ct_data + 1000) / 4000
        ct_data = np.clip(ct_data, 0, 1)

        return torch.FloatTensor(ct_data)

    @staticmethod
    def generate_labels(
        n_samples: int,
        n_classes: int = 2,
        seed: int = None,
    ) -> torch.Tensor:
        """
        Generate synthetic class labels.

        Args:
            n_samples: Number of samples.
            n_classes: Number of classes (default: 2 for schizophrenia).
            seed: Random seed.

        Returns:
            torch.Tensor: Labels shape (n_samples,).
        """
        logger.info(SyntheticDataGenerator.DISCLAIMER)

        if seed is not None:
            np.random.seed(seed)

        labels = np.random.randint(0, n_classes, n_samples)
        return torch.LongTensor(labels)

    @staticmethod
    def generate_multimodal_batch(
        n_samples: int = 8,
        modalities: list = None,
    ) -> Dict[str, torch.Tensor]:
        """
        Generate synthetic multimodal data.

        Args:
            n_samples: Number of samples.
            modalities: List of modalities to generate ('eeg', 'mri', 'fmri', 'ct').

        Returns:
            Dictionary containing tensors for each modality.
        """
        if modalities is None:
            modalities = ["eeg", "mri"]

        logger.info(SyntheticDataGenerator.DISCLAIMER)

        batch = {}

        for modality in modalities:
            if modality == "eeg":
                batch["eeg"] = SyntheticDataGenerator.generate_eeg_tensor(n_samples)
            elif modality == "mri":
                batch["mri"] = SyntheticDataGenerator.generate_mri_tensor(n_samples)
            elif modality == "fmri":
                batch["fmri"] = SyntheticDataGenerator.generate_fmri_tensor(n_samples)
            elif modality == "ct":
                batch["ct"] = SyntheticDataGenerator.generate_ct_tensor(n_samples)

        batch["labels"] = SyntheticDataGenerator.generate_labels(n_samples)

        return batch
