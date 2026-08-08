"""Training losses."""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional


class FocalLoss(nn.Module):
    """Focal Loss for handling class imbalance."""

    def __init__(self, alpha: float = 0.25, gamma: float = 2.0):
        """
        Initialize Focal Loss.

        Args:
            alpha: Weighting factor in (0, 1) to balance positive vs negative examples.
            gamma: Exponent of the modulating factor (1-p_t)^gamma.
        """
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma

    def forward(
        self,
        predictions: torch.Tensor,
        targets: torch.Tensor,
    ) -> torch.Tensor:
        """
        Calculate Focal Loss.

        Args:
            predictions: Predicted logits (batch, num_classes).
            targets: Ground truth labels (batch,).

        Returns:
            Focal loss value.
        """
        ce = F.cross_entropy(predictions, targets, reduction="none")
        pt = torch.exp(-ce)

        focal_loss = self.alpha * (1 - pt) ** self.gamma * ce

        return focal_loss.mean()


class WeightedCrossEntropyLoss(nn.Module):
    """Weighted Cross Entropy Loss for class imbalance."""

    def __init__(self, weights: Optional[torch.Tensor] = None):
        """
        Initialize Weighted Cross Entropy Loss.

        Args:
            weights: Class weights (num_classes,).
        """
        super().__init__()
        self.weights = weights

    def forward(
        self,
        predictions: torch.Tensor,
        targets: torch.Tensor,
    ) -> torch.Tensor:
        """
        Calculate weighted cross entropy loss.

        Args:
            predictions: Predicted logits (batch, num_classes).
            targets: Ground truth labels (batch,).

        Returns:
            Loss value.
        """
        return F.cross_entropy(
            predictions, targets, weight=self.weights, reduction="mean"
        )
