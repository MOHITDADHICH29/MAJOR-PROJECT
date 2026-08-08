"""EEG Transformer model."""

import torch
import torch.nn as nn
from typing import Tuple


class EEGTransformer(nn.Module):
    """Transformer for EEG signal classification."""

    def __init__(
        self,
        input_channels: int = 19,
        embedding_dim: int = 64,
        num_heads: int = 4,
        num_layers: int = 3,
        feedforward_dim: int = 256,
        dropout_rate: float = 0.1,
        output_dim: int = 128,
        num_classes: int = 2,
        patch_size: int = 10,
    ):
        """
        Initialize EEG Transformer.

        Args:
            input_channels: Number of EEG channels.
            embedding_dim: Embedding dimension.
            num_heads: Number of attention heads.
            num_layers: Number of transformer layers.
            feedforward_dim: Feedforward dimension.
            dropout_rate: Dropout rate.
            output_dim: Output embedding dimension.
            num_classes: Number of output classes.
            patch_size: Patch size for sequence construction.
        """
        super().__init__()

        self.input_channels = input_channels
        self.patch_size = patch_size
        self.embedding_dim = embedding_dim

        # Patch embedding
        self.patch_embedding = nn.Linear(
            input_channels * patch_size, embedding_dim
        )

        # Positional encoding
        self.positional_encoding = nn.Parameter(
            torch.randn(1, 100, embedding_dim)
        )

        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embedding_dim,
            nhead=num_heads,
            dim_feedforward=feedforward_dim,
            dropout=dropout_rate,
            batch_first=True,
        )
        self.transformer_encoder = nn.TransformerEncoder(
            encoder_layer, num_layers=num_layers
        )

        # FC layers
        self.fc = nn.Sequential(
            nn.LayerNorm(embedding_dim),
            nn.Linear(embedding_dim, output_dim),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(output_dim, num_classes),
        )

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Forward pass.

        Args:
            x: Input tensor (batch, channels, timepoints).

        Returns:
            Tuple of (logits, embeddings).
        """
        batch_size = x.shape[0]

        # Create patches
        x = x.transpose(1, 2)  # (batch, time, channels)
        patches = []
        for i in range(0, x.shape[1] - self.patch_size + 1, self.patch_size):
            patch = x[:, i : i + self.patch_size, :]
            patch = patch.reshape(batch_size, -1)
            patches.append(patch)

        if patches:
            x = torch.stack(patches, dim=1)  # (batch, n_patches, patch_dim)
        else:
            x = x.reshape(batch_size, 1, -1)

        # Embed patches
        x = self.patch_embedding(x)  # (batch, n_patches, embedding_dim)

        # Add positional encoding
        seq_len = x.shape[1]
        x = x + self.positional_encoding[:, :seq_len, :]

        # Transformer
        x = self.transformer_encoder(x)

        # Global average pooling
        embeddings = x.mean(dim=1)

        # FC
        logits = self.fc(embeddings)

        return logits, embeddings

    def get_embedding(self, x: torch.Tensor) -> torch.Tensor:
        """Get embedding without classification."""
        batch_size = x.shape[0]

        x = x.transpose(1, 2)
        patches = []
        for i in range(0, x.shape[1] - self.patch_size + 1, self.patch_size):
            patch = x[:, i : i + self.patch_size, :]
            patch = patch.reshape(batch_size, -1)
            patches.append(patch)

        if patches:
            x = torch.stack(patches, dim=1)
        else:
            x = x.reshape(batch_size, 1, -1)

        x = self.patch_embedding(x)
        seq_len = x.shape[1]
        x = x + self.positional_encoding[:, :seq_len, :]

        x = self.transformer_encoder(x)
        embeddings = x.mean(dim=1)

        return embeddings
