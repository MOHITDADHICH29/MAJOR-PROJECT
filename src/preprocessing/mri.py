"""MRI preprocessing module."""

import numpy as np
import logging
from typing import Dict, Tuple, Optional
from pathlib import Path

logger = logging.getLogger(__name__)


class MRIPreprocessor:
    """MRI preprocessing pipeline."""

    SUPPORTED_FORMATS = [".nii", ".nii.gz", ".dcm"]

    def __init__(self, config: Dict = None):
        """
        Initialize MRI preprocessor.

        Args:
            config: Configuration dictionary.
        """
        self.config = config or {}
        self.target_size = self.config.get("target_size", (96, 96, 96))

    def load_nifti(self, file_path: str) -> Tuple[np.ndarray, Dict]:
        """
        Load NIfTI file.

        Args:
            file_path: Path to NIfTI file.

        Returns:
            Tuple of (data, header_info).
        """
        try:
            import nibabel as nib

            nifti = nib.load(file_path)
            data = nifti.get_fdata()
            affine = nifti.affine

            logger.info(f"Loaded NIfTI file: {file_path}")
            return data, {"affine": affine, "shape": data.shape}
        except ImportError:
            logger.error("NiBabel required for NIfTI files")
            raise

    def load_dcm(self, file_path: str) -> Tuple[np.ndarray, Dict]:
        """
        Load DICOM file.

        Args:
            file_path: Path to DICOM file.

        Returns:
            Tuple of (data, metadata).
        """
        try:
            import pydicom

            dcm = pydicom.dcmread(file_path)
            data = dcm.pixel_array.astype(np.float32)

            logger.info(f"Loaded DICOM file: {file_path}")
            return data, {"modality": dcm.get("Modality", "Unknown")}
        except ImportError:
            logger.error("PyDICOM required for DICOM files")
            raise

    def normalize_intensity(
        self,
        data: np.ndarray,
        method: str = "min_max",
    ) -> np.ndarray:
        """
        Normalize intensity values.

        Args:
            data: Image data.
            method: Normalization method.

        Returns:
            Normalized data.
        """
        if method == "min_max":
            data_min = np.min(data)
            data_max = np.max(data)
            if data_max == data_min:
                normalized = np.zeros_like(data)
            else:
                normalized = (data - data_min) / (data_max - data_min)

        elif method == "zscore":
            mean = np.mean(data)
            std = np.std(data)
            if std == 0:
                normalized = np.zeros_like(data)
            else:
                normalized = (data - mean) / std

        else:
            raise ValueError(f"Unknown normalization method: {method}")

        logger.info(f"Applied {method} normalization")
        return normalized

    def resample_volume(
        self,
        data: np.ndarray,
        target_shape: Tuple[int, int, int] = None,
    ) -> np.ndarray:
        """
        Resample 3D volume.

        Args:
            data: 3D volume.
            target_shape: Target shape.

        Returns:
            Resampled volume.
        """
        from scipy.ndimage import zoom

        target_shape = target_shape or self.target_size

        current_shape = data.shape
        zoom_factors = tuple(t / c for t, c in zip(target_shape, current_shape))

        resampled = zoom(data, zoom_factors, order=1)

        logger.info(f"Resampled volume to shape {target_shape}")
        return resampled

    def preprocess_pipeline(
        self,
        data: np.ndarray,
        apply_normalization: bool = True,
        apply_resampling: bool = True,
    ) -> np.ndarray:
        """
        Apply preprocessing pipeline.

        Args:
            data: Raw MRI data.
            apply_normalization: Apply intensity normalization.
            apply_resampling: Apply resampling.

        Returns:
            Preprocessed data.
        """
        logger.info("Starting MRI preprocessing pipeline")

        if apply_normalization:
            data = self.normalize_intensity(data)

        if apply_resampling:
            data = self.resample_volume(data)

        logger.info("MRI preprocessing complete")
        return data
