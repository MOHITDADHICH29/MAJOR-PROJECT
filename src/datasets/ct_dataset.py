"""CT dataset class."""

import torch
import numpy as np
from typing import Dict, List, Optional
from .base_dataset import BaseDataset
import logging

logger = logging.getLogger(__name__)


class CTDataset(BaseDataset):
    """CT-specific dataset."""

    def __init__(
        self,
        data_list: List[Dict],
        imaging_config: Dict = None,
        transform=None,
        augmentation=None,
    ):
        """
        Initialize CT dataset.

        Args:
            data_list: List of data dictionaries with CT paths.
            imaging_config: Imaging configuration.
            transform: Optional transformation.
            augmentation: Optional augmentation.
        """
        super().__init__(data_list, transform, augmentation)
        self.imaging_config = imaging_config or {}
        self.target_size = tuple(self.imaging_config.get("target_size", (96, 96, 96)))

    def __getitem__(self, idx: int) -> Dict:
        """
        Get CT sample.

        Args:
            idx: Index.

        Returns:
            Dictionary with CT tensor and label.
        """
        item = self.data_list[idx]

        # Load CT data
        ct_tensor = self._load_ct(item.get("ct_path"))

        # Apply transformations
        if self.transform:
            ct_tensor = self.transform(ct_tensor)

        # Apply augmentation
        if self.augmentation:
            ct_tensor = self.augmentation(ct_tensor)

        return {
            "ct": ct_tensor,
            "label": torch.tensor(item.get("label", 0), dtype=torch.long),
            "subject_id": item.get("subject_id", "unknown"),
            "ct_path": item.get("ct_path", ""),
        }

    def _load_ct(self, ct_path: str) -> torch.Tensor:
        """
        Load CT data from file.

        Args:
            ct_path: Path to CT file.

        Returns:
            CT tensor (1, depth, height, width).
        """
        if not ct_path:
            raise ValueError("Missing CT path for sample")

        import nibabel as nib

        nifti = nib.load(ct_path)
        ct_data = nifti.get_fdata()

        if ct_data.ndim == 3:
            ct_data = np.expand_dims(ct_data, axis=0)

        if ct_data.shape != (1, *self.target_size):
            from src.preprocessing import resample_volume

            ct_data = resample_volume(
                ct_data[0] if ct_data.shape[0] == 1 else ct_data,
                self.target_size,
            )
            if ct_data.ndim == 3:
                ct_data = np.expand_dims(ct_data, axis=0)

        return torch.FloatTensor(ct_data)
