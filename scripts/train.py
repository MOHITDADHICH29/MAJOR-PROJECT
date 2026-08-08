"""Training script with synthetic data demo."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import logging
import argparse

from src.utils import get_logger, set_seed, get_device, SyntheticDataGenerator
from src.utils import ConfigLoader
from models.eeg import EEG1DCNN
from models.imaging import Imaging3DCNN
from models.fusion import LateFusion
from src.training import Trainer, FocalLoss

logging.basicConfig(level=logging.INFO)
logger = get_logger(__name__)


def main():
    """Main training function."""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--modality",
        default="eeg",
        choices=["eeg", "imaging", "multimodal"],
        help="Modality to train",
    )
    parser.add_argument("--epochs", type=int, default=10, help="Number of epochs")
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=0.0001)
    args = parser.parse_args()

    # Setup
    set_seed(42)
    device = get_device()
    config_loader = ConfigLoader("config")
    config = config_loader.load_config("config")

    logger.info(f"\n{'='*60}")
    logger.info("Training {args.modality}")
    logger.info(f"{'='*60}\n")

    logger.info("⚠️  SYNTHETIC TEST DATA — NOT MEDICAL DATA")

    # Generate synthetic data
    logger.info("Generating synthetic data...")
    batch = SyntheticDataGenerator.generate_multimodal_batch(
        n_samples=64,
        modalities=["eeg", "mri"],
    )

    # Create datasets
    if args.modality == "eeg":
        X_train = batch["eeg"]
        y_train = batch["labels"]

        train_dataset = TensorDataset(X_train, y_train)
        train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)

        # Model
        model = EEG1DCNN(input_channels=19, output_dim=128, num_classes=2)

    elif args.modality == "imaging":
        X_train = batch["mri"]
        y_train = batch["labels"]

        train_dataset = TensorDataset(X_train, y_train)
        train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)

        # Model
        model = Imaging3DCNN(input_channels=1, output_dim=128, num_classes=2)

    elif args.modality == "multimodal":
        X_eeg = batch["eeg"]
        X_mri = batch["mri"]
        y = batch["labels"]

        # Create multimodal dataset
        class MultimodalDataset(TensorDataset):
            def __getitem__(self, idx):
                return {
                    "eeg": X_eeg[idx],
                    "mri": X_mri[idx],
                    "label": y[idx],
                }

        train_dataset = MultimodalDataset(X_eeg, X_mri, y)
        train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)

        # Models
        eeg_model = EEG1DCNN(input_channels=19, output_dim=128, num_classes=2)
        mri_model = Imaging3DCNN(input_channels=1, output_dim=128, num_classes=2)

        # Fusion model
        embedding_dims = {"eeg": 128, "mri": 128}
        model = LateFusion(embedding_dims, fusion_dim=256, num_classes=2)

    # Move to device
    model = model.to(device)

    # Training
    criterion = FocalLoss(alpha=0.25, gamma=2.0)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr)

    logger.info(f"\nTraining for {args.epochs} epochs...")
    logger.info(f"Device: {device}")
    logger.info(f"Model: {model.__class__.__name__}")

    # Simple training loop
    model.train()
    for epoch in range(args.epochs):
        total_loss = 0
        correct = 0
        total = 0

        for batch_idx, batch_data in enumerate(train_loader):
            optimizer.zero_grad()

            if isinstance(batch_data, dict):
                # Multimodal
                eeg = batch_data["eeg"].to(device)
                mri = batch_data["mri"].to(device)
                labels = batch_data["label"].to(device)

                # Get embeddings from individual models
                eeg_logits, eeg_emb = eeg_model(eeg)
                mri_logits, mri_emb = mri_model(mri)

                # Fuse
                output = model({"eeg": eeg_emb, "mri": mri_emb})
            else:
                X, y = batch_data
                X = X.to(device)
                y = y.to(device)

                output, _ = model(X)

            labels = y if isinstance(batch_data, dict) else y

            loss = criterion(output, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            _, predicted = torch.max(output.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

        acc = correct / total
        avg_loss = total_loss / len(train_loader)

        logger.info(f"Epoch {epoch + 1}/{args.epochs} - Loss: {avg_loss:.4f}, Acc: {acc:.4f}")

    logger.info(f"\n{'='*60}")
    logger.info("Training Complete!")
    logger.info(f"{'='*60}\n")

    # Save model
    checkpoint_dir = Path("models/checkpoints")
    checkpoint_dir.mkdir(parents=True, exist_ok=True)

    checkpoint_path = checkpoint_dir / f"{args.modality}_model.pt"
    torch.save(model.state_dict(), checkpoint_path)

    logger.info(f"Model saved to {checkpoint_path}")
    logger.info("\n⚠️  Disclaimer:")
    logger.info("This training used SYNTHETIC data for demonstration purposes only.")
    logger.info("Results do NOT represent real model performance.")
    logger.info("Use real datasets for actual research and validation.\n")


if __name__ == "__main__":
    main()
