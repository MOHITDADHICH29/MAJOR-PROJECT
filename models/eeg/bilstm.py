"""EEG CNN + BiLSTM model."""

import torch
import torch.nn as nn
from typing import Tuple


class EEGCNNBiLSTM(nn.Module):
    """CNN + BiLSTM for EEG signal classification."""

    def __init__(
        self,
        input_channels: int = 19,
        cnn_filters: list = None,
        lstm_hidden_dim: int = 128,
        lstm_num_layers: int = 2,
        bidirectional: bool = True,
        dropout_rate: float = 0.5,
        output_dim: int = 128,
        num_classes: int = 2,
    ):
        """
        Initialize EEG CNN-BiLSTM.

        Args:
            input_channels: Number of EEG channels.
            cnn_filters: List of CNN filter sizes.
            lstm_hidden_dim: LSTM hidden dimension.
            lstm_num_layers: Number of LSTM layers.
            bidirectional: Use bidirectional LSTM.
            dropout_rate: Dropout rate.
            output_dim: Output embedding dimension.
            num_classes: Number of output classes.
        """
        super().__init__()

        if cnn_filters is None:
            cnn_filters = [16, 32]

        self.input_channels = input_channels
        self.dropout_rate = dropout_rate
        self.lstm_hidden_dim = lstm_hidden_dim
        self.bidirectional = bidirectional

        # CNN layers
        self.cnn = nn.Sequential(
            nn.Conv1d(
                input_channels, cnn_filters[0], kernel_size=5, padding=2
            ),
            nn.BatchNorm1d(cnn_filters[0]),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Dropout(dropout_rate),
            nn.Conv1d(
                cnn_filters[0], cnn_filters[1], kernel_size=5, padding=2
            ),
            nn.BatchNorm1d(cnn_filters[1]),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Dropout(dropout_rate),
        )

        # LSTM layers
        lstm_input_dim = cnn_filters[1]
        self.lstm = nn.LSTM(
            input_size=lstm_input_dim,
            hidden_size=lstm_hidden_dim,
            num_layers=lstm_num_layers,
            bidirectional=bidirectional,
            dropout=dropout_rate if lstm_num_layers > 1 else 0,
            batch_first=True,
        )

        # Calculate LSTM output dimension
        lstm_output_dim = lstm_hidden_dim * (2 if bidirectional else 1)

        # FC layers
        self.fc = nn.Sequential(
            nn.Linear(lstm_output_dim, output_dim),
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
        # CNN
        x = self.cnn(x)  # (batch, filters, time)

        # Transpose for LSTM
        x = x.transpose(1, 2)  # (batch, time, filters)

        # LSTM
        lstm_out, (h_n, c_n) = self.lstm(x)

        # Use final hidden state
        if self.bidirectional:
            embeddings = torch.cat([h_n[-2], h_n[-1]], dim=1)
        else:
            embeddings = h_n[-1]

        # FC
        logits = self.fc(embeddings)

        return logits, embeddings

    def get_embedding(self, x: torch.Tensor) -> torch.Tensor:
        """Get embedding without classification."""
        x = self.cnn(x)
        x = x.transpose(1, 2)
        _, (h_n, c_n) = self.lstm(x)

        if self.bidirectional:
            embeddings = torch.cat([h_n[-2], h_n[-1]], dim=1)
        else:
            embeddings = h_n[-1]

        return embeddings
