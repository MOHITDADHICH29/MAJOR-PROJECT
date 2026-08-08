"""Grad-CAM for 3D imaging."""

import torch
import numpy as np
import matplotlib.pyplot as plt
from typing import Dict, Tuple


class GradCAM:
    """Grad-CAM implementation for 3D images."""

    def __init__(self, model, target_layer):
        """
        Initialize Grad-CAM.

        Args:
            model: PyTorch model.
            target_layer: Layer to compute gradients for.
        """
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None

        # Register hooks
        self.target_layer.register_forward_hook(self._forward_hook)
        self.target_layer.register_full_backward_hook(self._backward_hook)

    def _forward_hook(self, module, input, output):
        """Store activations."""
        self.activations = output.detach()

    def _backward_hook(self, module, grad_input, grad_output):
        """Store gradients."""
        self.gradients = grad_output[0].detach()

    def generate_cam(
        self,
        input_tensor: torch.Tensor,
        target_class: int = None,
    ) -> np.ndarray:
        """
        Generate CAM heatmap.

        Args:
            input_tensor: Input image (batch, 1, D, H, W).
            target_class: Target class for which to generate CAM.

        Returns:
            CAM heatmap.
        """
        self.model.eval()

        # Forward pass
        output, _ = self.model(input_tensor)

        if target_class is None:
            target_class = output.argmax(dim=1)[0].item()

        # Backward pass
        self.model.zero_grad()
        target_score = output[0, target_class]
        target_score.backward()

        # Compute CAM
        gradients = self.gradients[0]  # (C, D, H, W)
        activations = self.activations[0]  # (C, D, H, W)

        weights = gradients.mean(dim=(1, 2, 3))  # (C,)

        cam = torch.zeros_like(activations[0])
        for i, w in enumerate(weights):
            cam += w * activations[i]

        cam = torch.relu(cam)
        cam = cam / (cam.max() + 1e-10)

        return cam.cpu().numpy()
