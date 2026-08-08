"""Training callbacks."""

import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class EarlyStoppingCallback:
    """Early stopping callback."""

    def __init__(self, patience: int = 10, min_delta: float = 0.0):
        """
        Initialize early stopping.

        Args:
            patience: Number of epochs without improvement before stopping.
            min_delta: Minimum change to qualify as an improvement.
        """
        self.patience = patience
        self.min_delta = min_delta
        self.counter = 0
        self.best_loss = None
        self.should_stop = False

    def __call__(self, current_loss: float) -> bool:
        """
        Check if training should stop.

        Args:
            current_loss: Current validation loss.

        Returns:
            Whether training should stop.
        """
        if self.best_loss is None:
            self.best_loss = current_loss
        elif current_loss < self.best_loss - self.min_delta:
            self.best_loss = current_loss
            self.counter = 0
        else:
            self.counter += 1
            if self.counter >= self.patience:
                self.should_stop = True
                logger.info(f"Early stopping triggered after {self.counter} epochs")

        return self.should_stop

    def reset(self):
        """Reset callback state."""
        self.counter = 0
        self.best_loss = None
        self.should_stop = False


class CheckpointCallback:
    """Checkpoint saving callback."""

    def __init__(self, save_dir: str, monitor_metric: str = "val_loss"):
        """
        Initialize checkpoint callback.

        Args:
            save_dir: Directory to save checkpoints.
            monitor_metric: Metric to monitor for saving.
        """
        self.save_dir = save_dir
        self.monitor_metric = monitor_metric
        self.best_value = None

    def should_save(self, metrics: Dict[str, float]) -> bool:
        """
        Check if checkpoint should be saved.

        Args:
            metrics: Dictionary of metrics.

        Returns:
            Whether checkpoint should be saved.
        """
        if self.monitor_metric not in metrics:
            return False

        current_value = metrics[self.monitor_metric]

        if self.best_value is None:
            self.best_value = current_value
            return True

        # For loss, lower is better; for accuracy, higher is better
        if "loss" in self.monitor_metric:
            if current_value < self.best_value:
                self.best_value = current_value
                return True
        else:
            if current_value > self.best_value:
                self.best_value = current_value
                return True

        return False
