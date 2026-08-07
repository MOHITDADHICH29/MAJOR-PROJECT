import argparse

import torch
import torch.nn as nn

from dataset import MultimodalSZDataset
from models import (
    Classifier,
    EEGFeatureExtractor,
    FusionModule,
    ImagingFeatureExtractor,
    MultimodalSZClassifier,
)


def parse_args():
    parser = argparse.ArgumentParser(description="Run inference with a trained multimodal SZ model")
    parser.add_argument("--checkpoint", type=str, required=True, help="Path to saved model checkpoint")
    parser.add_argument("--eeg_path", type=str, help="EEG file path for subject inference")
    parser.add_argument("--image_path", type=str, help="Imaging file path for subject inference")
    parser.add_argument("--dummy", action="store_true", help="Run inference on dummy synthetic input")
    parser.add_argument("--device", type=str, default="cuda" if torch.cuda.is_available() else "cpu")
    return parser.parse_args()


def load_model(checkpoint_path, device):
    checkpoint = torch.load(checkpoint_path, map_location=device)
    args = checkpoint.get("args", {})

    eeg_extractor = EEGFeatureExtractor()
    imaging_extractor = ImagingFeatureExtractor(backbone=args.get("imaging_backbone", "cnn3d"))
    fusion_module = FusionModule(strategy=args.get("fusion_type", "concat"))
    classifier = Classifier(classifier_type=args.get("classifier_type", "mlp"))
    model = MultimodalSZClassifier(
        eeg_extractor=eeg_extractor,
        imaging_extractor=imaging_extractor,
        fusion_module=fusion_module,
        classifier=classifier,
    ).to(device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    return model


def predict_single(model, eeg_tensor, image_tensor, device):
    eeg = eeg_tensor.unsqueeze(0).to(device)
    image = image_tensor.unsqueeze(0).to(device)
    with torch.no_grad():
        logits = model(eeg, image)
        probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
        pred = int(probs.argmax())
    return pred, probs.tolist()


def main():
    args = parse_args()
    device = torch.device(args.device)
    model = load_model(args.checkpoint, device)

    dataset = MultimodalSZDataset(dummy=args.dummy)
    if args.dummy:
        eeg_tensor, image_tensor, _ = dataset[0]
    else:
        if not args.eeg_path or not args.image_path:
            raise ValueError("For real inference, provide --eeg_path and --image_path")
        eeg_tensor, image_tensor = dataset.load_single_subject(args.eeg_path, args.image_path)

    pred, probs = predict_single(model, eeg_tensor, image_tensor, device)
    label_map = {0: "Healthy", 1: "Schizophrenia"}
    print("Prediction:")
    print(f"  label: {pred} ({label_map[pred]})")
    print(f"  probability: {probs}")


if __name__ == "__main__":
    main()
