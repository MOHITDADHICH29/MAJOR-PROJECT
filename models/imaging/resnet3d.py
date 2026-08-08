"""3D ResNet for imaging data."""

import torch
import torch.nn as nn
from typing import Tuple


class ResidualBlock3D(nn.Module):
    """3D Residual block."""

    def __init__(self, in_channels: int, out_channels: int, stride: int = 1):
        """
        Initialize residual block.

        Args:
            in_channels: Number of input channels.
            out_channels: Number of output channels.
            stride: Stride for convolution.
        """
        super().__init__()

        self.conv1 = nn.Conv3d(
            in_channels, out_channels, kernel_size=3, stride=stride, padding=1
        )
        self.bn1 = nn.BatchNorm3d(out_channels)

        self.conv2 = nn.Conv3d(
            out_channels, out_channels, kernel_size=3, stride=1, padding=1
        )
        self.bn2 = nn.BatchNorm3d(out_channels)

        self.relu = nn.ReLU(inplace=True)

        # Skip connection
        self.skip_projection = None
        if stride != 1 or in_channels != out_channels:
            self.skip_projection = nn.Sequential(
                nn.Conv3d(in_channels, out_channels, kernel_size=1, stride=stride),
                nn.BatchNorm3d(out_channels),
            )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass."""
        identity = x

        out = self.conv1(x)
        out = self.bn1(out)
        out = self.relu(out)

        out = self.conv2(out)
        out = self.bn2(out)

        if self.skip_projection:
            identity = self.skip_projection(x)

        out += identity
        out = self.relu(out)

        return out


class Imaging3DResNet(nn.Module):
    """3D ResNet for brain image classification."""

    def __init__(
        self,
        input_channels: int = 1,
        depth: int = 18,
        num_classes: int = 2,
        output_dim: int = 128,
    ):
        """
        Initialize 3D ResNet.

        Args:
            input_channels: Number of input channels.
            depth: Model depth (18, 34, 50, 101).
            num_classes: Number of output classes.
            output_dim: Output embedding dimension.
        """
        super().__init__()

        # Layer configuration
        if depth == 18:
            layers = [2, 2, 2, 2]
        elif depth == 34:
            layers = [3, 4, 6, 3]
        elif depth == 50:
            layers = [3, 4, 6, 3]
        else:
            raise ValueError(f"Unsupported depth: {depth}")

        # Initial convolution
        self.conv1 = nn.Conv3d(
            input_channels, 64, kernel_size=7, stride=2, padding=3
        )
        self.bn1 = nn.BatchNorm3d(64)
        self.relu = nn.ReLU(inplace=True)
        self.maxpool = nn.MaxPool3d(kernel_size=3, stride=2, padding=1)

        # Residual layers
        self.layer1 = self._make_layer(64, 64, layers[0], stride=1)
        self.layer2 = self._make_layer(64, 128, layers[1], stride=2)
        self.layer3 = self._make_layer(128, 256, layers[2], stride=2)
        self.layer4 = self._make_layer(256, 512, layers[3], stride=2)

        # Global average pooling
        self.global_pool = nn.AdaptiveAvgPool3d(1)

        # FC layers
        self.fc = nn.Sequential(
            nn.Linear(512, output_dim),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(output_dim, num_classes),
        )

    def _make_layer(
        self, in_channels: int, out_channels: int, blocks: int, stride: int = 1
    ) -> nn.Sequential:
        """Create a residual layer."""
        layers = []
        layers.append(ResidualBlock3D(in_channels, out_channels, stride))

        for _ in range(1, blocks):
            layers.append(ResidualBlock3D(out_channels, out_channels, stride=1))

        return nn.Sequential(*layers)

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Forward pass.

        Args:
            x: Input tensor (batch, 1, depth, height, width).

        Returns:
            Tuple of (logits, embeddings).
        """
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)

        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)

        x = self.global_pool(x)
        x = x.view(x.size(0), -1)

        embeddings = x
        logits = self.fc(x)

        return logits, embeddings

    def get_embedding(self, x: torch.Tensor) -> torch.Tensor:
        """Get embedding without classification."""
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)

        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)

        x = self.global_pool(x)
        x = x.view(x.size(0), -1)

        return x
