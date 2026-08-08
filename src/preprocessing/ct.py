"""CT preprocessing module."""

import numpy as np
import logging
from typing import Dict, Tuple, Optional
from pathlib import Path

logger = logging.getLogger(__name__)


class CTPreprocessor:
    """CT preprocessing pipeline."""

    SUPPORTED_FORMATS = [".dcm", ".nii", ".nii.gz"]

    def __init__(self, config: Dict = None):
        """
        Initialize CT preprocessor.

        Args:
            config: Configuration dictionary.
        """
        self.config = config or {}
        self.target_size = self.config.get("target_size", (96, 96, 96))
        self.window_center = self.config.get("window_center", 40)  # Brain window
        self.window_width = self.config.get("window_width", 80)

    def load_dcm_series(self, directory: str) -> Tuple[np.ndarray, Dict]:
        """
        Load DICOM series from directory.

        Args:
            directory: Directory containing DICOM files.

        Returns:
            Tuple of (volume, metadata).
        """
        try:
            import pydicom
            from pathlib import Path

            dcm_files = sorted(Path(directory).glob("*.dcm"))

            if not dcm_files:
                raise FileNotFoundError(f"No DICOM files found in {directory}")

            # Load first file to get metadata
            first_dcm = pydicom.dcmread(dcm_files[0])

            # Load all slices
            slices = []
            for dcm_file in dcm_files:
                dcm = pydicom.dcmread(dcm_file)
                slices.append(dcm.pixel_array.astype(np.float32))

            volume = np.stack(slices, axis=0)

            logger.info(f"Loaded {len(dcm_files)} DICOM slices")
            return volume, {"shape": volume.shape}

        except ImportError:
            logger.error("PyDICOM required for DICOM files")
            raise

    def load_nifti(self, file_path: str) -> Tuple[np.ndarray, Dict]:
        """
        Load NIfTI CT file.

        Args:
            file_path: Path to NIfTI file.

        Returns:
            Tuple of (data, metadata).
        """
        try:
            import nibabel as nib

            nifti = nib.load(file_path)
            data = nifti.get_fdata()

            logger.info(f"Loaded NIfTI CT file: {file_path}")
            return data, {"shape": data.shape}

        except ImportError:
            logger.error("NiBabel required for NIfTI files")
            raise

    def apply_windowing(
        self,
        data: np.ndarray,
        window_center: int = None,
        window_width: int = None,
    ) -> np.ndarray:
        """
        Apply CT windowing (Hounsfield unit windowing).

        Args:
            data: CT data in Hounsfield units.
            window_center: Window center (level).
            window_width: Window width.

        Returns:
            Windowed CT data.
        """
        window_center = window_center or self.window_center
        window_width = window_width or self.window_width

        window_min = window_center - window_width / 2
        window_max = window_center + window_width / 2

        windowed = np.clip(data, window_min, window_max)
        windowed = (windowed - window_min) / (window_max - window_min)

        logger.info(f"Applied CT windowing: center={window_center}, width={window_width}")
        return windowed

    def normalize_hu(
        self,
        data: np.ndarray,
        hu_min: float = -1000,
        hu_max: float = 3000,
    ) -> np.ndarray:
        """
        Normalize Hounsfield units to [0, 1].

        Args:
            data: CT data.
            hu_min: Minimum HU value.
            hu_max: Maximum HU value.

        Returns:
            Normalized data.
        """
        normalized = (data - hu_min) / (hu_max - hu_min)
        normalized = np.clip(normalized, 0, 1)

        logger.info("Applied Hounsfield unit normalization")
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
        apply_windowing: bool = True,
        apply_normalization: bool = True,
        apply_resampling: bool = True,
    ) -> np.ndarray:
        """
        Apply preprocessing pipeline.

        Args:
            data: Raw CT data.
            apply_windowing: Apply CT windowing.
            apply_normalization: Apply HU normalization.
            apply_resampling: Apply resampling.

        Returns:
            Preprocessed data.
        """
        logger.info("Starting CT preprocessing pipeline")

        if apply_windowing:
            data = self.apply_windowing(data)

        if apply_normalization:
            data = self.normalize_hu(data)

        if apply_resampling:
            data = self.resample_volume(data)

        logger.info("CT preprocessing complete")
        return data
