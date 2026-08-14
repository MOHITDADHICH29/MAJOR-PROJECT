"""MRI dataset class."""

import torch
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional
from .base_dataset import BaseDataset
import logging

logger = logging.getLogger(__name__)


class MRIDataset(BaseDataset):
    """MRI-specific dataset."""

    def __init__(
        self,
        data_list: List[Dict],
        imaging_config: Dict = None,
        transform=None,
        augmentation=None,
    ):
        """
        Initialize MRI dataset.

        Args:
            data_list: List of data dictionaries with MRI paths.
            imaging_config: Imaging configuration.
            transform: Optional transformation.
            augmentation: Optional augmentation.
        """
        super().__init__(data_list, transform, augmentation)
        self.imaging_config = imaging_config or {}
        self.target_size = tuple(self.imaging_config.get("target_size", (96, 96, 96)))
        self.use_cache = self.imaging_config.get("use_cache", True)
        self.cache_dir = Path(self.imaging_config.get("cache_dir", "data/processed/mri"))
        if self.use_cache:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._memory_cache = {}

    def __getitem__(self, idx: int) -> Dict:
        """
        Get MRI sample.

        Args:
            idx: Index.

        Returns:
            Dictionary with MRI tensor and label.
        """
        item = self.data_list[idx]
        subject_id = item.get("subject_id", f"sample_{idx}")

        # Load MRI data (using memory/disk cache if available)
        mri_tensor = self._load_mri(item.get("mri_path"), subject_id=subject_id)

        # Apply transformations
        if self.transform:
            mri_tensor = self.transform(mri_tensor)

        # Apply augmentation
        if self.augmentation:
            mri_tensor = self.augmentation(mri_tensor)

        return {
            "mri": mri_tensor,
            "label": torch.tensor(item.get("label", 0), dtype=torch.long),
            "subject_id": subject_id,
            "mri_path": item.get("mri_path", ""),
        }

    def _load_mri(self, mri_path: str, subject_id: str = "") -> torch.Tensor:
        """
        Load MRI data from file or cache.

        Args:
            mri_path: Path to MRI file.
            subject_id: Optional subject identifier for caching.

        Returns:
            MRI tensor (1, depth, height, width).
        """
        if not mri_path:
            raise ValueError("Missing MRI path for sample")

        if self.use_cache and subject_id in self._memory_cache:
            return self._memory_cache[subject_id].clone()

        cache_file = None
        if self.use_cache and subject_id:
            safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in subject_id)
            cache_file = self.cache_dir / f"{safe_name}_{self.target_size[0]}x{self.target_size[1]}x{self.target_size[2]}.pt"
            if cache_file.exists():
                try:
                    tensor = torch.load(cache_file, weights_only=True)
                    self._memory_cache[subject_id] = tensor
                    return tensor.clone()
                except Exception:
                    pass

        import nibabel as nib
        from src.utils.paths import resolve_data_path

        file_path = resolve_data_path(mri_path)
        nifti = nib.load(str(file_path))
        mri_data = nifti.get_fdata().astype("float32")

        if mri_data.ndim == 3:
            mri_data = np.expand_dims(mri_data, axis=0)

        if mri_data.shape != (1, *self.target_size):
            from src.preprocessing import resample_volume

            mri_data = resample_volume(
                mri_data[0] if mri_data.shape[0] == 1 else mri_data,
                self.target_size,
            )
            if mri_data.ndim == 3:
                mri_data = np.expand_dims(mri_data, axis=0)

        from src.preprocessing.common import normalize_tensor

        norm_method = self.imaging_config.get("normalization", {}).get("method", "min_max")
        mri_data[0] = normalize_tensor(mri_data[0], method=norm_method)

        tensor = torch.FloatTensor(mri_data)

        if self.use_cache:
            if cache_file is not None:
                try:
                    torch.save(tensor, cache_file)
                except Exception:
                    pass
            if subject_id:
                self._memory_cache[subject_id] = tensor

        return tensor.clone()

