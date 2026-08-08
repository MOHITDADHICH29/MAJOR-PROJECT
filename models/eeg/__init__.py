"""EEG models package."""

from .cnn import EEG1DCNN
from .bilstm import EEGCNNBiLSTM
from .transformer import EEGTransformer

__all__ = ["EEG1DCNN", "EEGCNNBiLSTM", "EEGTransformer"]
