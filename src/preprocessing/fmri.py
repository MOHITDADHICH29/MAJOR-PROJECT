"""fMRI preprocessing module."""

import numpy as np
import logging
from typing import Dict, Tuple, Optional
from pathlib import Path

logger = logging.getLogger(__name__)


class fMRIPreprocessor:
    """fMRI preprocessing pipeline."""

    SUPPORTED_FORMATS = [".nii", ".nii.gz"]

    def __init__(self, config: Dict = None):
        """
        Initialize fMRI preprocessor.

        Args:
            config: Configuration dictionary.
        """
        self.config = config or {}
        self.tr = self.config.get("tr", None)
        self.high_pass = self.config.get("high_pass_filter", 0.01)
        self.low_pass = self.config.get("low_pass_filter", 0.1)

    def load_nifti(self, file_path: str) -> Tuple[np.ndarray, Dict]:
        """
        Load NIfTI fMRI file.

        Args:
            file_path: Path to NIfTI file.

        Returns:
            Tuple of (data, header_info).
        """
        try:
            import nibabel as nib

            nifti = nib.load(file_path)
            data = nifti.get_fdata()

            # Get TR if available
            tr = None
            if hasattr(nifti, "header"):
                tr = nifti.header.get_zooms()[3] if len(nifti.header.get_zooms()) > 3 else None

            logger.info(f"Loaded fMRI file: {file_path}")
            return data, {"shape": data.shape, "tr": tr}
        except ImportError:
            logger.error("NiBabel required for NIfTI files")
            raise

    def extract_roi_timeseries(
        self,
        data: np.ndarray,
        atlas: str = "AAL90",
    ) -> np.ndarray:
        """
        Extract ROI timeseries from fMRI data using spatial parcellation.

        Uses Nilearn AAL atlas when available; otherwise divides the volume
        into equal spatial blocks and averages each block's timeseries.
        """
        if data.ndim != 4:
            raise ValueError(f"Expected 4D fMRI data, got shape {data.shape}")

        n_rois = 90 if atlas == "AAL90" else 116

        try:
            from nilearn.datasets import fetch_atlas_aal
            from nilearn.maskers import NiftiLabelsMasker
            import nibabel as nib

            atlas_data = fetch_atlas_aal()
            atlas_img = atlas_data.maps
            masker = NiftiLabelsMasker(labels_img=atlas_img, standardize=True)
            data_img = nib.Nifti1Image(data, np.eye(4))
            roi_timeseries = masker.fit_transform(data_img).T
            logger.info("Extracted %d ROI timeseries via AAL atlas", roi_timeseries.shape[0])
            return roi_timeseries
        except Exception as exc:
            logger.warning("Atlas extraction unavailable (%s). Using spatial blocks.", exc)
            return self._extract_block_timeseries(data, n_rois)

    def _extract_block_timeseries(self, data: np.ndarray, n_rois: int) -> np.ndarray:
        """Divide the volume into spatial blocks and average each block's timeseries."""
        x, y, z, t = data.shape
        grid = int(np.ceil(n_rois ** (1 / 3)))
        block_x = max(1, x // grid)
        block_y = max(1, y // grid)
        block_z = max(1, z // grid)

        timeseries = []
        for i in range(grid):
            for j in range(grid):
                for k in range(grid):
                    if len(timeseries) >= n_rois:
                        break
                    xs, xe = i * block_x, min((i + 1) * block_x, x)
                    ys, ye = j * block_y, min((j + 1) * block_y, y)
                    zs, ze = k * block_z, min((k + 1) * block_z, z)
                    block = data[xs:xe, ys:ye, zs:ze, :]
                    timeseries.append(block.reshape(-1, t).mean(axis=0))

        roi_timeseries = np.stack(timeseries[:n_rois], axis=0)
        logger.info("Extracted %d block ROI timeseries", roi_timeseries.shape[0])
        return roi_timeseries

    def compute_connectivity_matrix(
        self,
        roi_timeseries: np.ndarray,
        method: str = "correlation",
    ) -> np.ndarray:
        """
        Compute functional connectivity matrix.

        Args:
            roi_timeseries: ROI timeseries (n_rois, time).
            method: Connectivity method ('correlation', 'covariance').

        Returns:
            Connectivity matrix (n_rois, n_rois).
        """
        if method == "correlation":
            connectivity = np.corrcoef(roi_timeseries)
        elif method == "covariance":
            connectivity = np.cov(roi_timeseries)
        else:
            raise ValueError(f"Unknown connectivity method: {method}")

        logger.info(f"Computed {method} connectivity matrix")
        return connectivity

    def normalize_intensity(
        self,
        data: np.ndarray,
        method: str = "zscore",
    ) -> np.ndarray:
        """
        Normalize fMRI intensity.

        Args:
            data: fMRI data.
            method: Normalization method.

        Returns:
            Normalized data.
        """
        if method == "zscore":
            mean = np.mean(data)
            std = np.std(data)
            if std == 0:
                normalized = np.zeros_like(data)
            else:
                normalized = (data - mean) / std

        elif method == "min_max":
            data_min = np.min(data)
            data_max = np.max(data)
            if data_max == data_min:
                normalized = np.zeros_like(data)
            else:
                normalized = (data - data_min) / (data_max - data_min)

        else:
            raise ValueError(f"Unknown normalization method: {method}")

        logger.info(f"Applied {method} normalization")
        return normalized

    def preprocess_pipeline(
        self,
        data: np.ndarray,
        extract_roi: bool = True,
        compute_connectivity: bool = True,
    ) -> Dict:
        """
        Apply preprocessing pipeline.

        Args:
            data: Raw fMRI data.
            extract_roi: Extract ROI timeseries.
            compute_connectivity: Compute connectivity matrix.

        Returns:
            Dictionary with preprocessed data.
        """
        logger.info("Starting fMRI preprocessing pipeline")

        # Normalize
        data = self.normalize_intensity(data)

        results = {"volumetric_data": data}

        if extract_roi:
            roi_timeseries = self.extract_roi_timeseries(data)
            results["roi_timeseries"] = roi_timeseries

            if compute_connectivity:
                connectivity = self.compute_connectivity_matrix(roi_timeseries)
                results["connectivity_matrix"] = connectivity

        logger.info("fMRI preprocessing complete")
        return results
