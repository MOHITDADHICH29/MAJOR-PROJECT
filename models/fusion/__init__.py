"""Multimodal fusion models."""

import torch
import torch.nn as nn
from typing import Dict, Tuple, Optional, List


class EarlyFusion(nn.Module):
    """Early fusion by concatenating embeddings."""

    def __init__(
        self,
        embedding_dims: Dict[str, int],
        hidden_dims: List[int] = None,
        dropout_rate: float = 0.5,
        num_classes: int = 2,
    ):
        """
        Initialize early fusion model.

        Args:
            embedding_dims: Dictionary of embedding dimensions for each modality.
            hidden_dims: Hidden layer dimensions.
            dropout_rate: Dropout rate.
            num_classes: Number of output classes.
        """
        super().__init__()

        if hidden_dims is None:
            hidden_dims = [256, 128]

        # Concatenated embedding dimension
        total_dim = sum(embedding_dims.values())

        # FC layers
        layers = []
        in_dim = total_dim

        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(in_dim, hidden_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(dropout_rate))
            in_dim = hidden_dim

        layers.append(nn.Linear(in_dim, num_classes))

        self.fc = nn.Sequential(*layers)

    def forward(self, embeddings: Dict[str, torch.Tensor]) -> torch.Tensor:
        """
        Forward pass.

        Args:
            embeddings: Dictionary of embeddings from each modality.

        Returns:
            Classification logits.
        """
        # Concatenate embeddings
        concat_embedding = torch.cat(list(embeddings.values()), dim=1)

        # FC layers
        logits = self.fc(concat_embedding)

        return logits


class LateFusion(nn.Module):
    """Late fusion by combining predictions."""

    def __init__(
        self,
        embedding_dims: Dict[str, int],
        fusion_dim: int = 256,
        output_layers: List[int] = None,
        dropout_rate: float = 0.5,
        num_classes: int = 2,
    ):
        """
        Initialize late fusion model.

        Args:
            embedding_dims: Dictionary of embedding dimensions for each modality.
            fusion_dim: Fusion layer dimension.
            output_layers: Output layer dimensions.
            dropout_rate: Dropout rate.
            num_classes: Number of output classes.
        """
        super().__init__()

        if output_layers is None:
            output_layers = [256, 128]

        # Modality-specific classifiers
        self.modality_classifiers = nn.ModuleDict()
        for modality, dim in embedding_dims.items():
            self.modality_classifiers[modality] = nn.Sequential(
                nn.Linear(dim, fusion_dim),
                nn.ReLU(),
                nn.Dropout(dropout_rate),
                nn.Linear(fusion_dim, num_classes),
            )

        # Fusion layer
        fusion_input_dim = fusion_dim * len(embedding_dims)

        layers = []
        in_dim = fusion_input_dim

        for output_dim in output_layers:
            layers.append(nn.Linear(in_dim, output_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(dropout_rate))
            in_dim = output_dim

        layers.append(nn.Linear(in_dim, num_classes))

        self.fusion_head = nn.Sequential(*layers)

    def forward(self, embeddings: Dict[str, torch.Tensor]) -> torch.Tensor:
        """
        Forward pass.

        Args:
            embeddings: Dictionary of embeddings from each modality.

        Returns:
            Classification logits.
        """
        # Get modality predictions
        fusion_features = []

        for modality, embedding in embeddings.items():
            if modality in self.modality_classifiers:
                feat = self.modality_classifiers[modality](embedding)
                fusion_features.append(feat)

        # Concatenate features
        if fusion_features:
            fusion_input = torch.cat(fusion_features, dim=1)
        else:
            fusion_input = torch.cat(list(embeddings.values()), dim=1)

        # Fusion head
        logits = self.fusion_head(fusion_input)

        return logits


class AttentionFusion(nn.Module):
    """Attention-based multimodal fusion."""

    def __init__(
        self,
        embedding_dims: Dict[str, int],
        hidden_dim: int = 256,
        num_heads: int = 4,
        num_layers: int = 2,
        dropout_rate: float = 0.1,
        num_classes: int = 2,
    ):
        """
        Initialize attention fusion model.

        Args:
            embedding_dims: Dictionary of embedding dimensions for each modality.
            hidden_dim: Hidden dimension for attention.
            num_heads: Number of attention heads.
            num_layers: Number of attention layers.
            dropout_rate: Dropout rate.
            num_classes: Number of output classes.
        """
        super().__init__()

        self.embedding_dims = embedding_dims
        self.hidden_dim = hidden_dim

        # Project embeddings to common dimension
        self.projections = nn.ModuleDict()
        for modality, dim in embedding_dims.items():
            self.projections[modality] = nn.Linear(dim, hidden_dim)

        # Attention layers
        attention_layer = nn.TransformerEncoderLayer(
            d_model=hidden_dim,
            nhead=num_heads,
            dim_feedforward=hidden_dim * 2,
            dropout=dropout_rate,
            batch_first=True,
        )
        self.attention_encoder = nn.TransformerEncoder(
            attention_layer, num_layers=num_layers
        )

        # Classification head
        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim * len(embedding_dims), hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(hidden_dim, num_classes),
        )

    def forward(self, embeddings: Dict[str, torch.Tensor]) -> torch.Tensor:
        """
        Forward pass.

        Args:
            embeddings: Dictionary of embeddings from each modality.

        Returns:
            Classification logits.
        """
        # Project to common dimension
        projected = []
        for modality, embedding in embeddings.items():
            proj = self.projections[modality](embedding)
            projected.append(proj)

        # Stack for attention
        stacked = torch.stack(projected, dim=1)  # (batch, modalities, hidden_dim)

        # Apply attention
        attended = self.attention_encoder(stacked)

        # Flatten
        flattened = attended.reshape(attended.size(0), -1)

        # Classify
        logits = self.classifier(flattened)

        return logits
