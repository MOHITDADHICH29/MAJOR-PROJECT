"""Saliency maps."""

import torch
import numpy as np


class SaliencyMaps:
    """Generate saliency maps."""

    @staticmethod
    def compute_saliency(
        model,
        input_tensor: torch.Tensor,
        target_class: int = None,
    ) -> np.ndarray:
        """
        Compute saliency map.

        Args:
            model: PyTorch model.
            input_tensor: Input tensor.
            target_class: Target class.

        Returns:
            Saliency map.
        """
        input_tensor.requires_grad = True

        model.eval()
        output, _ = model(input_tensor)

        if target_class is None:
            target_class = output.argmax(dim=1)[0].item()

        target_score = output[0, target_class]
        target_score.backward()

        saliency = input_tensor.grad.abs().max(dim=1)[0]
        saliency = saliency / (saliency.max() + 1e-10)

        return saliency.cpu().detach().numpy()
