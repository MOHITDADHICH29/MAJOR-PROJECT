"""Main trainer class."""

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from typing import Dict, Tuple, Optional, List
import logging
from pathlib import Path
from tqdm import tqdm

logger = logging.getLogger(__name__)


class Trainer:
    """Trainer for model training and validation."""

    def __init__(
        self,
        model: nn.Module,
        train_loader: DataLoader,
        val_loader: DataLoader,
        criterion: nn.Module,
        optimizer: torch.optim.Optimizer,
        device: torch.device,
        checkpoint_dir: str = "models/checkpoints",
    ):
        """
        Initialize trainer.

        Args:
            model: PyTorch model.
            train_loader: Training data loader.
            val_loader: Validation data loader.
            criterion: Loss function.
            optimizer: Optimizer.
            device: Device to train on.
            checkpoint_dir: Directory to save checkpoints.
        """
        self.model = model
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.criterion = criterion
        self.optimizer = optimizer
        self.device = device
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)

        self.train_losses = []
        self.val_losses = []
        self.train_accuracies = []
        self.val_accuracies = []

    def train_epoch(self) -> Tuple[float, float]:
        """
        Train for one epoch.

        Returns:
            Tuple of (average_loss, accuracy).
        """
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0

        progress_bar = tqdm(
            self.train_loader,
            desc="Training",
            leave=False,
        )

        for batch in progress_bar:
            # Move data to device
            if isinstance(batch, dict):
                # Multimodal data
                for key in batch:
                    if isinstance(batch[key], torch.Tensor):
                        batch[key] = batch[key].to(self.device)
                labels = batch["label"]
                # Prepare input
                inputs = {k: v for k, v in batch.items() if k in ["eeg", "mri", "fmri", "ct"]}
            else:
                inputs, labels = batch
                inputs = inputs.to(self.device)
                labels = labels.to(self.device)

            # Forward pass
            self.optimizer.zero_grad()

            if isinstance(inputs, dict):
                outputs, _ = self.model(inputs)
            else:
                outputs, _ = self.model(inputs)

            loss = self.criterion(outputs, labels)

            # Backward pass
            loss.backward()
            self.optimizer.step()

            # Track metrics
            total_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

        avg_loss = total_loss / len(self.train_loader)
        accuracy = correct / total

        return avg_loss, accuracy

    def validate(self) -> Tuple[float, float]:
        """
        Validate the model.

        Returns:
            Tuple of (average_loss, accuracy).
        """
        self.model.eval()
        total_loss = 0
        correct = 0
        total = 0

        with torch.no_grad():
            progress_bar = tqdm(
                self.val_loader,
                desc="Validation",
                leave=False,
            )

            for batch in progress_bar:
                # Move data to device
                if isinstance(batch, dict):
                    for key in batch:
                        if isinstance(batch[key], torch.Tensor):
                            batch[key] = batch[key].to(self.device)
                    labels = batch["label"]
                    inputs = {k: v for k, v in batch.items() if k in ["eeg", "mri", "fmri", "ct"]}
                else:
                    inputs, labels = batch
                    inputs = inputs.to(self.device)
                    labels = labels.to(self.device)

                # Forward pass
                if isinstance(inputs, dict):
                    outputs, _ = self.model(inputs)
                else:
                    outputs, _ = self.model(inputs)

                loss = self.criterion(outputs, labels)

                # Track metrics
                total_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()

        avg_loss = total_loss / len(self.val_loader)
        accuracy = correct / total

        return avg_loss, accuracy

    def train(
        self,
        num_epochs: int,
        early_stopping_patience: int = 10,
        save_best: bool = True,
    ) -> Dict[str, List]:
        """
        Train the model.

        Args:
            num_epochs: Number of epochs to train.
            early_stopping_patience: Patience for early stopping.
            save_best: Whether to save best model.

        Returns:
            Dictionary with training history.
        """
        best_val_loss = float("inf")
        patience_counter = 0

        for epoch in range(num_epochs):
            # Train
            train_loss, train_acc = self.train_epoch()
            self.train_losses.append(train_loss)
            self.train_accuracies.append(train_acc)

            # Validate
            val_loss, val_acc = self.validate()
            self.val_losses.append(val_loss)
            self.val_accuracies.append(val_acc)

            logger.info(
                f"Epoch {epoch + 1}/{num_epochs} - "
                f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f}, "
                f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}"
            )

            # Early stopping
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0

                if save_best:
                    self.save_checkpoint(f"best_model.pt")
            else:
                patience_counter += 1
                if patience_counter >= early_stopping_patience:
                    logger.info(f"Early stopping at epoch {epoch + 1}")
                    break

        return {
            "train_losses": self.train_losses,
            "train_accuracies": self.train_accuracies,
            "val_losses": self.val_losses,
            "val_accuracies": self.val_accuracies,
        }

    def save_checkpoint(self, filename: str):
        """Save model checkpoint."""
        filepath = self.checkpoint_dir / filename
        torch.save(
            {
                "model_state_dict": self.model.state_dict(),
                "optimizer_state_dict": self.optimizer.state_dict(),
            },
            filepath,
        )
        logger.info(f"Checkpoint saved: {filepath}")

    def load_checkpoint(self, filename: str):
        """Load model checkpoint."""
        filepath = self.checkpoint_dir / filename
        checkpoint = torch.load(filepath, map_location=self.device)
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
        logger.info(f"Checkpoint loaded: {filepath}")
