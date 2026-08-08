"""EEG explainability."""

import numpy as np
import matplotlib.pyplot as plt
from typing import Dict, Tuple


class EEGExplainability:
    """EEG model explainability."""

    @staticmethod
    def get_channel_importance(
        model,
        eeg_data: np.ndarray,
        device,
    ) -> np.ndarray:
        """
        Compute channel importance via input gradient.

        Args:
            model: PyTorch model.
            eeg_data: EEG data (channels, timepoints).
            device: Device.

        Returns:
            Channel importance scores.
        """
        import torch

        eeg_tensor = torch.FloatTensor(eeg_data).unsqueeze(0).to(device)
        eeg_tensor.requires_grad = True

        model.eval()
        output, _ = model(eeg_tensor)

        # Get gradient for the predicted class
        output.sum().backward()

        # Channel importance
        channel_importance = eeg_tensor.grad.abs().mean(dim=(0, 2)).cpu().numpy()

        return channel_importance

    @staticmethod
    def plot_channel_importance(
        channel_importance: np.ndarray,
        channel_names: list = None,
        save_path: str = None,
    ) -> plt.Figure:
        """Plot channel importance."""
        if channel_names is None:
            channel_names = [f"Ch{i}" for i in range(len(channel_importance))]

        fig, ax = plt.subplots(figsize=(12, 6))
        ax.bar(range(len(channel_importance)), channel_importance)
        ax.set_xlabel("EEG Channels")
        ax.set_ylabel("Importance Score")
        ax.set_xticks(range(len(channel_names)))
        ax.set_xticklabels(channel_names, rotation=45)
        ax.set_title("EEG Channel Importance")

        plt.tight_layout()

        if save_path:
            fig.savefig(save_path, dpi=300)

        return fig
