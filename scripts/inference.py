"""Inference on real Schizophrenia EEG or ds004302 MRI data."""

import argparse
import logging
import sys
from pathlib import Path

import torch

sys.path.insert(0, str(Path(__file__).parent.parent))

from models.eeg import EEG1DCNN
from models.imaging import Imaging3DCNN
from src.datasets.eeg_dataset import EEGDataset
from src.datasets.mri_dataset import MRIDataset
from src.utils import ConfigLoader, get_device, get_logger, set_seed

logging.basicConfig(level=logging.INFO)
logger = get_logger(__name__)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--modality",
        default="eeg",
        choices=["eeg", "imaging"],
        required=True,
    )
    parser.add_argument("--model-path", required=True, help="Path to model checkpoint")
    parser.add_argument("--data-path", required=True, help="Path to input data file")
    args = parser.parse_args()

    set_seed(42)
    device = get_device()
    config_loader = ConfigLoader("config")

    if args.modality == "eeg":
        eeg_config = config_loader.load_config("eeg_config").get("eeg", {})
        sample = EEGDataset(
            [{"subject_id": "inference", "label": 0, "eeg_path": args.data_path}],
            eeg_config=eeg_config,
        )[0]
        model = EEG1DCNN(input_channels=19, output_dim=128, num_classes=2)
        model.load_state_dict(torch.load(args.model_path, map_location=device))
        model = model.to(device).eval()
        data = sample["eeg"].unsqueeze(0).to(device)
        with torch.no_grad():
            logits, _ = model(data)
    else:
        imaging_config = config_loader.load_config("imaging_config").get("imaging", {})
        sample = MRIDataset(
            [{"subject_id": "inference", "label": 0, "mri_path": args.data_path}],
            imaging_config=imaging_config,
        )[0]
        model = Imaging3DCNN(input_channels=1, output_dim=128, num_classes=2)
        model.load_state_dict(torch.load(args.model_path, map_location=device))
        model = model.to(device).eval()
        data = sample["mri"].unsqueeze(0).to(device)
        with torch.no_grad():
            logits, _ = model(data)

    proba = torch.softmax(logits, dim=1)
    pred_class = torch.argmax(proba, dim=1).item()
    confidence = proba[0, pred_class].item()

    class_names = ["Healthy Control", "Schizophrenia"]
    logger.info("Predicted Class: %s", class_names[pred_class])
    logger.info("Confidence: %.2f%%", confidence * 100)
    logger.info("Logits: %s", logits.cpu().numpy()[0])
    logger.info("Research prototype — not for clinical use.")


if __name__ == "__main__":
    main()
