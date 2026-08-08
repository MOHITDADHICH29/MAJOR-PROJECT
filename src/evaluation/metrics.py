"""Evaluation metrics."""

import numpy as np
import torch
from typing import Dict, Tuple
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)
import logging

logger = logging.getLogger(__name__)


class Metrics:
    """Compute evaluation metrics."""

    @staticmethod
    def compute_metrics(
        predictions: np.ndarray,
        ground_truth: np.ndarray,
    ) -> Dict[str, float]:
        """
        Compute classification metrics.

        Args:
            predictions: Predicted labels (batch,).
            ground_truth: Ground truth labels (batch,).

        Returns:
            Dictionary of metrics.
        """
        if isinstance(predictions, torch.Tensor):
            predictions = predictions.cpu().numpy()
        if isinstance(ground_truth, torch.Tensor):
            ground_truth = ground_truth.cpu().numpy()

        metrics = {
            "accuracy": accuracy_score(ground_truth, predictions),
            "precision": precision_score(ground_truth, predictions, average="weighted", zero_division=0),
            "recall": recall_score(ground_truth, predictions, average="weighted", zero_division=0),
            "f1": f1_score(ground_truth, predictions, average="weighted", zero_division=0),
        }

        # Sensitivity and Specificity (for binary classification)
        if len(np.unique(ground_truth)) == 2:
            tn, fp, fn, tp = confusion_matrix(ground_truth, predictions).ravel()
            metrics["sensitivity"] = tp / (tp + fn) if (tp + fn) > 0 else 0
            metrics["specificity"] = tn / (tn + fp) if (tn + fp) > 0 else 0

        return metrics

    @staticmethod
    def compute_roc_auc(
        predictions_proba: np.ndarray,
        ground_truth: np.ndarray,
    ) -> float:
        """
        Compute ROC-AUC score.

        Args:
            predictions_proba: Predicted probabilities (batch, num_classes).
            ground_truth: Ground truth labels (batch,).

        Returns:
            ROC-AUC score.
        """
        try:
            if predictions_proba.shape[1] == 2:
                return roc_auc_score(ground_truth, predictions_proba[:, 1])
            else:
                return roc_auc_score(
                    ground_truth, predictions_proba, multi_class="ovr"
                )
        except Exception as e:
            logger.warning(f"Could not compute ROC-AUC: {e}")
            return 0.0

    @staticmethod
    def get_confusion_matrix(
        predictions: np.ndarray,
        ground_truth: np.ndarray,
    ) -> np.ndarray:
        """
        Get confusion matrix.

        Args:
            predictions: Predicted labels.
            ground_truth: Ground truth labels.

        Returns:
            Confusion matrix.
        """
        return confusion_matrix(ground_truth, predictions)
