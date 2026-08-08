"""Imaging features extraction."""

import numpy as np


class ImagingFeatureExtractor:
    """Extract features from imaging data."""

    @staticmethod
    def extract_volumetric_features(volume: np.ndarray) -> dict:
        """Extract basic volumetric statistics."""
        return {
            "volume_mean": np.mean(volume),
            "volume_std": np.std(volume),
            "volume_median": np.median(volume),
        }
