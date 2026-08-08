#!/usr/bin/env python3
"""Training script that uses real EEA data."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
import logging
import argparse
import csv
import numpy as np

from src.utils import get_logger, set_seed, get_device, ConfigLoader
from src.datasets.eeg_dataset import EEGDataset
from models.eeg import EEG1DCNN
from src.training.losses import FocalLoss

logging.basicConfig(level=logging.INFO)
logger = get_logger(__name__)


def load_manifest(manifest_path: Path) -> list:
    """Load dataset manifest CSV."""
    data_list = []
    with open(manifest_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data_list.append({
                'subject_id': row['subject_id'],
                'label': int(row['label']),
                'eeg_path': row['eeg_path'],
            })
    return data_list


def custom_collate_fn(batch):
    """Custom collate function to handle variable-length EEG sequences."""
    # Find max length in batch
    max_length = max(item['eeg'].shape[1] for item in batch)
    
    # Pad all sequences to max length
    padded_eegs = []
    labels = []
    subject_ids = []
    paths = []
    
    for item in batch:
        eeg = item['eeg']
        n_channels, n_samples = eeg.shape
        
        if n_samples < max_length:
            # Pad with zeros
            padding = torch.zeros(n_channels, max_length - n_samples)
            eeg = torch.cat([eeg, padding], dim=1)
        else:
            # Truncate to max length
            eeg = eeg[:, :max_length]
        
        padded_eegs.append(eeg)
        labels.append(item['label'])
        subject_ids.append(item['subject_id'])
        paths.append(item['eeg_path'])
    
    return {
        'eeg': torch.stack(padded_eegs),
        'label': torch.tensor(labels, dtype=torch.long),
        'subject_id': subject_ids,
        'eeg_path': paths,
    }


def main():
    """Main training function."""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--modality",
        default="eeg",
        choices=["eeg"],
        help="Modality to train",
    )
    parser.add_argument("--epochs", type=int, default=50, help="Number of epochs")
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=0.0001)
    parser.add_argument(
        "--use-real-data",
        action="store_true",
        help="Use real data instead of synthetic",
    )
    parser.add_argument(
        "--data-path",
        type=str,
        default="data/metadata/dataset_manifest.csv",
        help="Path to dataset manifest",
    )
    args = parser.parse_args()

    # Setup
    set_seed(42)
    device = get_device()
    config_loader = ConfigLoader("config")
    config = config_loader.load_config("config")

    logger.info(f"\n{'='*70}")
    if args.use_real_data:
        logger.info(f"TRAINING ON REAL DATA - Modality: {args.modality}")
    else:
        logger.info(f"TRAINING ON SYNTHETIC DATA - Modality: {args.modality}")
    logger.info(f"{'='*70}\n")

    # Load data
    manifest_path = Path(args.data_path)
    
    if args.use_real_data and manifest_path.exists():
        logger.info(f"📁 Loading real data from {manifest_path}")
        data_list = load_manifest(manifest_path)
        logger.info(f"   ✓ Found {len(data_list)} subjects")
        
        # Split data
        train_size = int(0.7 * len(data_list))
        val_size = int(0.15 * len(data_list))
        test_size = len(data_list) - train_size - val_size
        
        train_data = data_list[:train_size]
        val_data = data_list[train_size:train_size + val_size]
        test_data = data_list[train_size + val_size:]
        
        logger.info(f"   Split: Train={len(train_data)}, Val={len(val_data)}, Test={len(test_data)}")
        
        # Create datasets
        eeg_config = config.get("eeg", {})
        train_dataset = EEGDataset(train_data, eeg_config=eeg_config)
        val_dataset = EEGDataset(val_data, eeg_config=eeg_config)
        test_dataset = EEGDataset(test_data, eeg_config=eeg_config)
        
        logger.info(f"   ✓ Created datasets")
        
    else:
        logger.warning("⚠️  Data manifest not found, using synthetic data")
        logger.warning("   To use real data, run: python scripts/prepare_real_data.py")
        
        from src.utils import SyntheticDataGenerator
        
        # Generate synthetic data
        logger.info("Generating synthetic data...")
        n_samples = 128
        eeg_data = []
        labels = []
        
        for _ in range(n_samples):
            eeg_tensor = SyntheticDataGenerator.generate_eeg_tensor(
                n_samples=1, n_channels=19, n_timepoints=1024
            )
            eeg_data.append(eeg_tensor[0])
            labels.append(np.random.randint(0, 2))
        
        X = torch.from_numpy(np.array(eeg_data)).float()
        y = torch.from_numpy(np.array(labels)).long()
        
        # Split
        train_size = int(0.7 * len(X))
        val_size = int(0.15 * len(X))
        test_size = len(X) - train_size - val_size
        
        train_data = torch.utils.data.TensorDataset(
            X[:train_size], y[:train_size]
        )
        val_data = torch.utils.data.TensorDataset(
            X[train_size:train_size+val_size], 
            y[train_size:train_size+val_size]
        )
        test_data = torch.utils.data.TensorDataset(
            X[train_size+val_size:], 
            y[train_size+val_size:]
        )
        
        train_dataset = train_data
        val_dataset = val_data
        test_dataset = test_data

    # Create data loaders
    train_loader = DataLoader(
        train_dataset, 
        batch_size=args.batch_size, 
        shuffle=True,
        num_workers=0,
        collate_fn=custom_collate_fn
    )
    val_loader = DataLoader(
        val_dataset, 
        batch_size=args.batch_size, 
        shuffle=False,
        num_workers=0,
        collate_fn=custom_collate_fn
    )

    # Model
    logger.info(f"\n📊 Building model...")
    model = EEG1DCNN(
        input_channels=19, 
        output_dim=128, 
        num_classes=2
    )
    model = model.to(device)
    logger.info(f"   ✓ Model created: {model.__class__.__name__}")

    # Training setup
    criterion = FocalLoss(alpha=0.25, gamma=2.0)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr)
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=10, gamma=0.5)

    logger.info(f"\n🚀 Training Configuration:")
    logger.info(f"   Epochs: {args.epochs}")
    logger.info(f"   Batch Size: {args.batch_size}")
    logger.info(f"   Learning Rate: {args.lr}")
    logger.info(f"   Device: {device}")

    # Training loop
    logger.info(f"\n{'='*70}")
    logger.info("Training...")
    logger.info(f"{'='*70}")
    
    best_val_acc = 0.0
    checkpoint_dir = Path("models/checkpoints")
    checkpoint_dir.mkdir(parents=True, exist_ok=True)

    for epoch in range(args.epochs):
        # Train
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0

        for batch_idx, batch_data in enumerate(train_loader):
            optimizer.zero_grad()

            if isinstance(batch_data, dict):
                # Real data from EEGDataset
                X = batch_data["eeg"].to(device)
                y = batch_data["label"].to(device)
            else:
                # Synthetic data
                X, y = batch_data
                X = X.to(device)
                y = y.to(device)

            # Forward
            output, _ = model(X)
            loss = criterion(output, y)
            
            # Backward
            loss.backward()
            optimizer.step()

            train_loss += loss.item()
            _, predicted = torch.max(output.data, 1)
            train_correct += (predicted == y).sum().item()
            train_total += y.size(0)

        train_loss /= len(train_loader)
        train_acc = train_correct / train_total

        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for batch_data in val_loader:
                if isinstance(batch_data, dict):
                    X = batch_data["eeg"].to(device)
                    y = batch_data["label"].to(device)
                else:
                    X, y = batch_data
                    X = X.to(device)
                    y = y.to(device)

                output, _ = model(X)
                loss = criterion(output, y)

                val_loss += loss.item()
                _, predicted = torch.max(output.data, 1)
                val_correct += (predicted == y).sum().item()
                val_total += y.size(0)

        val_loss /= len(val_loader)
        val_acc = val_correct / val_total

        logger.info(
            f"Epoch {epoch+1:3d}/{args.epochs} | "
            f"Loss: {train_loss:.4f} | Acc: {train_acc:.4f} | "
            f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.4f}"
        )

        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), checkpoint_dir / "eeg_model_best.pt")

        scheduler.step()

    # Save final model
    torch.save(model.state_dict(), checkpoint_dir / "eeg_model_final.pt")

    logger.info(f"\n{'='*70}")
    logger.info("✓ Training Complete!")
    logger.info(f"{'='*70}")
    logger.info(f"Best validation accuracy: {best_val_acc:.4f}")
    logger.info(f"Model saved to {checkpoint_dir / 'eeg_model_best.pt'}")


if __name__ == "__main__":
    main()
