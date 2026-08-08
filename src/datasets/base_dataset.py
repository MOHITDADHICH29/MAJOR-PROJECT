"""Base dataset class."""

import torch
import numpy as np
from torch.utils.data import Dataset
from typing import Dict, Tuple, Optional, List
import logging

logger = logging.getLogger(__name__)


class BaseDataset(Dataset):
    """Base class for all datasets."""

    def __init__(
        self,
        data_list: List[Dict],
        transform=None,
        augmentation=None,
    ):
        """
        Initialize base dataset.

        Args:
            data_list: List of data dictionaries.
            transform: Optional transformation pipeline.
            augmentation: Optional augmentation pipeline.
        """
        self.data_list = data_list
        self.transform = transform
        self.augmentation = augmentation

    def __len__(self) -> int:
        """Get dataset length."""
        return len(self.data_list)

    def __getitem__(self, idx: int) -> Dict:
        """
        Get item from dataset.

        Args:
            idx: Index.

        Returns:
            Dictionary with sample data.
        """
        raise NotImplementedError

    def get_class_distribution(self) -> Dict[int, int]:
        """
        Get class distribution.

        Returns:
            Dictionary with class counts.
        """
        distribution = {}
        for item in self.data_list:
            label = item.get("label", 0)
            distribution[label] = distribution.get(label, 0) + 1

        return distribution

    def get_class_weights(self) -> torch.Tensor:
        """
        Get class weights for imbalanced datasets.

        Returns:
            Tensor of class weights.
        """
        distribution = self.get_class_distribution()
        total = sum(distribution.values())

        weights = []
        for class_id in sorted(distribution.keys()):
            weight = total / (len(distribution) * distribution[class_id])
            weights.append(weight)

        return torch.FloatTensor(weights)

    def get_subject_ids(self) -> List[str]:
        """
        Get list of subject IDs.

        Returns:
            List of subject IDs.
        """
        return [item.get("subject_id", f"subject_{i}") for i, item in enumerate(self.data_list)]

    def create_subject_splits(
        self,
        train_ratio: float = 0.7,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
        seed: int = 42,
    ) -> Tuple[List[int], List[int], List[int]]:
        """
        Create subject-level splits to prevent data leakage.

        Args:
            train_ratio: Training split ratio.
            val_ratio: Validation split ratio.
            test_ratio: Test split ratio.
            seed: Random seed.

        Returns:
            Tuple of (train_indices, val_indices, test_indices).
        """
        np.random.seed(seed)

        subject_ids = self.get_subject_ids()
        unique_subjects = list(set(subject_ids))
        np.random.shuffle(unique_subjects)

        n_subjects = len(unique_subjects)
        n_train = int(n_subjects * train_ratio)
        n_val = int(n_subjects * val_ratio)

        train_subjects = unique_subjects[:n_train]
        val_subjects = unique_subjects[n_train : n_train + n_val]
        test_subjects = unique_subjects[n_train + n_val :]

        train_indices = [i for i, subj in enumerate(subject_ids) if subj in train_subjects]
        val_indices = [i for i, subj in enumerate(subject_ids) if subj in val_subjects]
        test_indices = [i for i, subj in enumerate(subject_ids) if subj in test_subjects]

        logger.info(f"Created subject-level splits:")
        logger.info(f"  Train: {len(train_indices)} samples ({len(train_subjects)} subjects)")
        logger.info(f"  Val: {len(val_indices)} samples ({len(val_subjects)} subjects)")
        logger.info(f"  Test: {len(test_indices)} samples ({len(test_subjects)} subjects)")

        return train_indices, val_indices, test_indices
