"""Confusion matrix visualization."""

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import List, Optional


class ConfusionMatrixGenerator:
    """Generate confusion matrices."""

    @staticmethod
    def plot_confusion_matrix(
        predictions: np.ndarray,
        ground_truth: np.ndarray,
        class_names: List[str] = None,
        save_path: Optional[str] = None,
    ) -> plt.Figure:
        """
        Plot confusion matrix.

        Args:
            predictions: Predicted labels.
            ground_truth: Ground truth labels.
            class_names: Names of classes.
            save_path: Path to save figure.

        Returns:
            Matplotlib figure.
        """
        from sklearn.metrics import confusion_matrix

        cm = confusion_matrix(ground_truth, predictions)

        if class_names is None:
            class_names = [f"Class {i}" for i in range(cm.shape[0])]

        fig, ax = plt.subplots(figsize=(8, 6))

        sns.heatmap(
            cm,
            annot=True,
            fmt="d",
            cmap="Blues",
            xticklabels=class_names,
            yticklabels=class_names,
            ax=ax,
        )

        ax.set_ylabel("Ground Truth")
        ax.set_xlabel("Predictions")
        ax.set_title("Confusion Matrix")

        plt.tight_layout()

        if save_path:
            fig.savefig(save_path, dpi=300, bbox_inches="tight")

        return fig
