"""3D CNN for imaging data."""

import torch
import torch.nn as nn
from typing import Tuple


class Imaging3DCNN(nn.Module):
    """3D CNN for brain image classification."""

    def __init__(
        self,
        input_channels: int = 1,
        num_filters: list = None,
        kernel_size: int = 3,
        pool_size: int = 2,
        dropout_rate: float = 0.5,
        output_dim: int = 128,
        num_classes: int = 2,
    ):
        """
        Initialize 3D CNN.

        Args:
            input_channels: Number of input channels.
            num_filters: List of filter sizes.
            kernel_size: Convolution kernel size.
            pool_size: Pooling size.
            dropout_rate: Dropout rate.
            output_dim: Output embedding dimension.
            num_classes: Number of output classes.
        """
        super().__init__()

        if num_filters is None:
            num_filters = [8, 16, 32, 64]

        self.conv_blocks = nn.ModuleList()
        in_channels = input_channels

        for out_channels in num_filters:
            self.conv_blocks.append(
                nn.Sequential(
                    nn.Conv3d(
                        in_channels,
                        out_channels,
                        kernel_size=kernel_size,
                        padding=kernel_size // 2,
                    ),
                    nn.BatchNorm3d(out_channels),
                    nn.ReLU(),
                    nn.MaxPool3d(pool_size),
                    nn.Dropout(dropout_rate),
                )
            )
            in_channels = out_channels

        # Global average pooling
        self.global_pool = nn.AdaptiveAvgPool3d(1)

        # Fully connected layers
        self.fc = nn.Sequential(
            nn.Linear(in_channels, output_dim),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(output_dim, num_classes),
        )

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Forward pass.

        Args:
            x: Input tensor (batch, 1, depth, height, width).

        Returns:
            Tuple of (logits, embeddings).
        """
        # Conv blocks
        for conv_block in self.conv_blocks:
            x = conv_block(x)

        # Global pooling
        x = self.global_pool(x)
        x = x.view(x.size(0), -1)

        # FC layers
        embeddings = x
        logits = self.fc(x)

        return logits, embeddings

    def get_embedding(self, x: torch.Tensor) -> torch.Tensor:
        """Get embedding without classification."""
        for conv_block in self.conv_blocks:
            x = conv_block(x)

        x = self.global_pool(x)
        x = x.view(x.size(0), -1)

        return x
