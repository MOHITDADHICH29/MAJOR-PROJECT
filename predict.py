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
from models.early_fusion import EarlyFusionClassifier


def parse_args():
    parser = argparse.ArgumentParser(description="Run inference with a trained multimodal SZ model")
    parser.add_argument("--checkpoint", type=str, required=True, help="Path to saved model checkpoint")
    parser.add_argument("--eeg_path", type=str, help="EEG file path for subject inference")
    parser.add_argument("--image_path", type=str, help="Imaging file path for subject inference")
    parser.add_argument("--dummy", action="store_true", help="Run inference on dummy synthetic input")
    parser.add_argument("--device", type=str, default="cuda" if torch.cuda.is_available() else "cpu")
    return parser.parse_args()


def load_model(checkpoint_path, device):
    """Load model from checkpoint, auto-detecting the architecture."""
    checkpoint = torch.load(checkpoint_path, map_location=device)
    saved_args = checkpoint.get("args", {})
    architecture = saved_args.get("architecture", "early_fusion")

    if architecture == "early_fusion":
        # Detect EEG channels from checkpoint weights if available
        eeg_channels = saved_args.get("eeg_channels", 19)
        if "model_state_dict" in checkpoint:
            for k in ["eeg_tokenizer.cnn.0.weight", "eeg_extractor.cnn.0.weight"]:
                if k in checkpoint["model_state_dict"]:
                    eeg_channels = checkpoint["model_state_dict"][k].shape[1]
                    break

        model = EarlyFusionClassifier(
            eeg_channels=eeg_channels,
            eeg_cnn_channels=(64, 128, 256),
            eeg_target_tokens=64,
            use_spectrogram=False,
            mri_in_channels=1,
            mri_cnn_channels=(32, 64, 128, 256),
            mri_target_tokens=64,
            embed_dim=saved_args.get("embed_dim", 256),
            transformer_depth=saved_args.get("transformer_depth", 4),
            transformer_heads=saved_args.get("transformer_heads", 4),
            ffn_dim=saved_args.get("ffn_dim", 512),
            dropout=saved_args.get("dropout", 0.1),
            num_classes=2,
            classifier_hidden=128,
            use_auxiliary_losses=True,
            aux_loss_weight=saved_args.get("aux_loss_weight", 0.3),
        ).to(device)
        print(f"[INFO] Loaded EarlyFusionClassifier from checkpoint (eeg_channels={eeg_channels})")
    else:
        # Legacy Late Fusion
        eeg_extractor = EEGFeatureExtractor()
        imaging_extractor = ImagingFeatureExtractor(
            backbone=saved_args.get("imaging_backbone", "cnn3d")
        )
        fusion_module = FusionModule(
            strategy=saved_args.get("fusion_type", "concat")
        )
        classifier = Classifier(
            classifier_type=saved_args.get("classifier_type", "mlp")
        )
        model = MultimodalSZClassifier(
            eeg_extractor=eeg_extractor,
            imaging_extractor=imaging_extractor,
            fusion_module=fusion_module,
            classifier=classifier,
        ).to(device)
        print(f"[INFO] Loaded LateFusion MultimodalSZClassifier from checkpoint")

    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    return model


def predict_single(model, eeg_tensor, image_tensor, device):
    """Run inference on a single subject."""
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
