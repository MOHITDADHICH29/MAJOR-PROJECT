"""Models package providing both Early Fusion (Unified Transformer Backbone) and Late Fusion architectures."""

from .early_fusion import (
    EarlyFusionClassifier,
    EEGTokenizer,
    MRITokenizer,
    MultimodalTransformerBackbone,
)

# Legacy / individual model exports
from .legacy_sz import (
    Classifier,
    EEGFeatureExtractor,
    ImagingFeatureExtractor,
    FusionModule,
    MultimodalSZClassifier,
    ViT3D,
)
from .eeg import EEG1DCNN, EEGCNNBiLSTM, EEGTransformer
from .imaging import Imaging3DCNN, Imaging3DResNet
from .fusion import EarlyFusion, LateFusion, AttentionFusion

__all__ = [
    "EarlyFusionClassifier",
    "EEGTokenizer",
    "MRITokenizer",
    "MultimodalTransformerBackbone",
    "Classifier",
    "EEGFeatureExtractor",
    "ImagingFeatureExtractor",
    "FusionModule",
    "MultimodalSZClassifier",
    "ViT3D",
    "EEG1DCNN",
    "EEGCNNBiLSTM",
    "EEGTransformer",
    "Imaging3DCNN",
    "Imaging3DResNet",
    "EarlyFusion",
    "LateFusion",
    "AttentionFusion",
]
