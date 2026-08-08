"""Inference script for running predictions."""

import torch
import argparse
import logging
from pathlib import Path
import numpy as np

from src.utils import get_logger, set_seed, get_device, SyntheticDataGenerator
from src.utils import ConfigLoader
from models.eeg import EEG1DCNN
from models.imaging import Imaging3DCNN

logging.basicConfig(level=logging.INFO)
logger = get_logger(__name__)


def main():
    """Run inference on new data."""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--modality",
        default="eeg",
        choices=["eeg", "imaging", "multimodal"],
    )
    parser.add_argument("--model-path", required=True, help="Path to model checkpoint")
    parser.add_argument("--data-path", help="Path to input data file")
    args = parser.parse_args()

    set_seed(42)
    device = get_device()

    logger.info(f"\n{'='*60}")
    logger.info("Inference - Schizophrenia Detection")
    logger.info(f"{'='*60}\n")

    logger.info("⚠️  RESEARCH PROTOTYPE — NOT A CLINICAL DIAGNOSTIC TOOL")

    # Load model
    logger.info(f"Loading model from {args.model_path}...")

    if args.modality == "eeg":
        model = EEG1DCNN(input_channels=19, output_dim=128, num_classes=2)
        model.load_state_dict(torch.load(args.model_path, map_location=device))
    elif args.modality == "imaging":
        model = Imaging3DCNN(input_channels=1, output_dim=128, num_classes=2)
        model.load_state_dict(torch.load(args.model_path, map_location=device))
    else:
        logger.error("Multimodal inference requires separate implementation")
        return

    model = model.to(device)
    model.eval()

    # Generate or load data
    if args.data_path:
        logger.info(f"Loading data from {args.data_path}...")
        # TODO: Implement loading from file
        logger.warning("Data loading from file not yet implemented")
    else:
        logger.info("Using synthetic test data...")

        if args.modality == "eeg":
            data = SyntheticDataGenerator.generate_eeg_tensor(n_samples=1)
        else:
            data = SyntheticDataGenerator.generate_mri_tensor(n_samples=1)

    # Run inference
    with torch.no_grad():
        if isinstance(data, np.ndarray):
            data = torch.from_numpy(data).float()

        data = data.to(device)
        logits, embeddings = model(data)
        proba = torch.softmax(logits, dim=1)
        pred_class = torch.argmax(proba, dim=1).item()
        confidence = proba[0, pred_class].item()

    # Display results
    logger.info(f"\n{'='*60}")
    logger.info("Results")
    logger.info(f"{'='*60}\n")

    class_names = ["Healthy Control", "Schizophrenia"]
    logger.info(f"Predicted Class: {class_names[pred_class]}")
    logger.info(f"Confidence: {confidence:.2%}")
    logger.info(f"Logits: {logits.cpu().numpy()[0]}")

    logger.info(f"\n{'='*60}")
    logger.info("Disclaimer")
    logger.info(f"{'='*60}\n")

    logger.info("⚠️  This is a RESEARCH prediction and is NOT a clinical diagnosis.")
    logger.info("Results must be interpreted by licensed medical professionals.")
    logger.info("Do NOT use for clinical decision-making.\n")


if __name__ == "__main__":
    main()
