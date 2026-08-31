"""Early Fusion multimodal model for schizophrenia classification.

Instead of processing each modality with independent full backbones and fusing
their final embeddings (Late Fusion), this module converts raw EEG and MRI data
into token sequences via lightweight tokenizers, concatenates them with learned
modality + positional embeddings, and passes everything through a single unified
Transformer backbone.  This enables cross-modal attention at every layer.
"""

import math
from typing import Dict, Optional, Tuple

import torch
import torch.nn as nn


def get_sinusoidal_pos_embed(seq_len: int, embed_dim: int, device: torch.device) -> torch.Tensor:
    """Generate sinusoidal positional embeddings for any sequence length."""
    pos = torch.arange(seq_len, dtype=torch.float32, device=device).unsqueeze(1)
    div_term = torch.exp(
        torch.arange(0, embed_dim, 2, dtype=torch.float32, device=device) * (-math.log(10000.0) / embed_dim)
    )
    pos_embed = torch.zeros(1, seq_len, embed_dim, device=device)
    pos_embed[0, :, 0::2] = torch.sin(pos * div_term)
    pos_embed[0, :, 1::2] = torch.cos(pos * div_term)
    return pos_embed


# ---------------------------------------------------------------------------
# EEG Tokenizer
# ---------------------------------------------------------------------------

class EEGTokenizer(nn.Module):
    """Convert raw EEG (B, C, T) into a sequence of tokens (B, N_eeg, D).

    A lightweight 1D-CNN downsamples the temporal axis and projects each
    resulting time-step into the unified embedding dimension *D*.
    No LSTM, no final global pooling — the spatial/temporal token structure
    is preserved so the downstream Transformer can attend to individual tokens.
    """

    def __init__(
        self,
        eeg_channels: int = 32,
        cnn_channels: Tuple[int, ...] = (64, 128, 256),
        embed_dim: int = 256,
        target_tokens: Optional[int] = 64,
        use_spectrogram: bool = False,
    ):
        super().__init__()
        self.use_spectrogram = use_spectrogram
        self.embed_dim = embed_dim
        self.target_tokens = target_tokens

        if use_spectrogram:
            # 2D CNN path for spectrogram input (B, C, F, T)
            layers = []
            in_ch = eeg_channels
            for out_ch in cnn_channels:
                layers.extend([
                    nn.Conv2d(in_ch, out_ch, kernel_size=3, padding=1),
                    nn.BatchNorm2d(out_ch),
                    nn.GELU(),
                    nn.MaxPool2d(kernel_size=(2, 2)),
                ])
                in_ch = out_ch
            self.cnn = nn.Sequential(*layers)
            self.proj = nn.Linear(cnn_channels[-1], embed_dim)
        else:
            # 1D CNN path for raw waveform input (B, C, T)
            layers = []
            in_ch = eeg_channels
            for i, out_ch in enumerate(cnn_channels):
                kernel = 7 if i == 0 else 5 if i == 1 else 3
                padding = kernel // 2
                layers.extend([
                    nn.Conv1d(in_ch, out_ch, kernel_size=kernel, padding=padding),
                    nn.BatchNorm1d(out_ch),
                    nn.GELU(),
                    nn.MaxPool1d(kernel_size=2),
                ])
                in_ch = out_ch
            self.cnn = nn.Sequential(*layers)
            self.proj = nn.Linear(cnn_channels[-1], embed_dim)

        if target_tokens is not None:
            self.token_pool = nn.AdaptiveAvgPool1d(target_tokens)
        else:
            self.token_pool = None

        self.norm = nn.LayerNorm(embed_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Raw EEG tensor.
                Waveform: (B, C, T) where C=eeg_channels, T=timesteps.
                Spectrogram: (B, C, F, T).
        Returns:
            tokens: (B, N_eeg, embed_dim)
        """
        if self.use_spectrogram:
            x = self.cnn(x)                         # (B, cnn[-1], F', T')
            # Collapse frequency axis, keep time as token axis
            x = nn.functional.adaptive_avg_pool2d(x, output_size=(1, x.shape[-1]))
            x = x.squeeze(2)                        # (B, cnn[-1], T')
            if self.token_pool is not None:
                x = self.token_pool(x)              # (B, cnn[-1], target_tokens)
            x = x.permute(0, 2, 1)                  # (B, N_eeg, cnn[-1])
        else:
            x = self.cnn(x)                          # (B, cnn[-1], T')
            if self.token_pool is not None:
                x = self.token_pool(x)              # (B, cnn[-1], target_tokens)
            x = x.permute(0, 2, 1)                   # (B, N_eeg, cnn[-1])

        tokens = self.proj(x)                         # (B, N_eeg, D)
        tokens = self.norm(tokens)
        return tokens


# ---------------------------------------------------------------------------
# MRI Tokenizer
# ---------------------------------------------------------------------------

class MRITokenizer(nn.Module):
    """Convert an MRI volume (B, 1, D, H, W) into a sequence of tokens (B, N_mri, D).

    A lightweight 3D-CNN downsamples spatially and then flattens the remaining
    spatial grid into a token sequence, each projected to dimension *D*.
    """

    def __init__(
        self,
        in_channels: int = 1,
        cnn_channels: Tuple[int, ...] = (32, 64, 128, 256),
        embed_dim: int = 256,
        target_tokens: Optional[int] = 64,
    ):
        super().__init__()
        self.embed_dim = embed_dim
        self.target_tokens = target_tokens

        layers = []
        in_ch = in_channels
        for out_ch in cnn_channels:
            layers.extend([
                nn.Conv3d(in_ch, out_ch, kernel_size=3, padding=1),
                nn.BatchNorm3d(out_ch),
                nn.GELU(),
                nn.MaxPool3d(kernel_size=2),
            ])
            in_ch = out_ch
        self.cnn = nn.Sequential(*layers)

        if target_tokens is not None:
            self.token_pool = nn.AdaptiveAvgPool1d(target_tokens)
        else:
            self.token_pool = None

        self.proj = nn.Linear(cnn_channels[-1], embed_dim)
        self.norm = nn.LayerNorm(embed_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: MRI volume (B, 1, D, H, W).  Typically (B, 1, 64, 64, 64) or (B, 1, 96, 96, 96).
        Returns:
            tokens: (B, N_mri, embed_dim)
        """
        x = self.cnn(x)                # (B, cnn[-1], d', h', w')
        b, c, d, h, w = x.shape
        x = x.reshape(b, c, d * h * w)  # (B, cnn[-1], N_mri)
        if self.token_pool is not None:
            x = self.token_pool(x)      # (B, cnn[-1], target_tokens)
        x = x.permute(0, 2, 1)          # (B, N_mri, cnn[-1])
        tokens = self.proj(x)            # (B, N_mri, D)
        tokens = self.norm(tokens)
        return tokens


# ---------------------------------------------------------------------------
# Unified Transformer Backbone
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Gated Asymmetric Cross-Attention
# ---------------------------------------------------------------------------

class GatedCrossAttention(nn.Module):
    """Asymmetric cross-attention: EEG (Query) attends to MRI (Key/Value).

    Prevents noisy MRI features from degrading the clean EEG representation:
    - EEG embeddings act as Queries (Q)
    - MRI embeddings act as Keys (K) and Values (V)
    - A learned tanh gate (initialized to 0.0) ensures MRI features only
      modulate EEG with a gentle residual refinement.
    """

    def __init__(self, embed_dim: int, num_heads: int = 4, dropout: float = 0.1):
        super().__init__()
        self.cross_attn = nn.MultiheadAttention(
            embed_dim, num_heads, dropout=dropout, batch_first=True
        )
        self.q_norm = nn.LayerNorm(embed_dim)
        self.kv_norm = nn.LayerNorm(embed_dim)
        self.gate = nn.Parameter(torch.zeros(1))

    def forward(self, eeg_tokens: torch.Tensor, mri_tokens: torch.Tensor) -> torch.Tensor:
        q = self.q_norm(eeg_tokens)
        kv = self.kv_norm(mri_tokens)
        attn_out, _ = self.cross_attn(query=q, key=kv, value=kv)
        gamma = torch.tanh(self.gate)
        return eeg_tokens + gamma * attn_out


# ---------------------------------------------------------------------------
# Transformer Backbone (Unified sequence)
# ---------------------------------------------------------------------------

class MultimodalTransformerBackbone(nn.Module):
    """Unified Transformer encoder operating over gated & concatenated modality tokens.

    Features:
    - Gated asymmetric cross-attention alignment
    - Learnable [CLS] token prepended to the sequence
    - Learnable modality-type embeddings (EEG vs MRI)
    - Dynamic sinusoidal positional embeddings (supports any token length)
    - Standard Transformer encoder with Pre-LN for training stability
    """

    def __init__(
        self,
        embed_dim: int = 256,
        depth: int = 6,
        num_heads: int = 8,
        ffn_dim: int = 512,
        dropout: float = 0.1,
        max_seq_len: int = 512,
        num_modalities: int = 2,
    ):
        super().__init__()
        self.embed_dim = embed_dim
        self.max_seq_len = max_seq_len

        # Asymmetric cross-attention module
        self.gated_cross_attn = GatedCrossAttention(embed_dim, num_heads=num_heads, dropout=dropout)

        # [CLS] token
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))

        # Modality type embeddings (0 = EEG, 1 = MRI)
        self.modality_embed = nn.Embedding(num_modalities, embed_dim)

        # Learnable positional embeddings for standard lengths
        self.pos_embed = nn.Parameter(torch.zeros(1, max_seq_len + 1, embed_dim))

        # Pre-encoder layer norm
        self.pre_norm = nn.LayerNorm(embed_dim)

        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embed_dim,
            nhead=num_heads,
            dim_feedforward=ffn_dim,
            dropout=dropout,
            activation="gelu",
            batch_first=True,
            norm_first=True,  # Pre-LN for training stability
        )
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers=depth)
        self.final_norm = nn.LayerNorm(embed_dim)

        self._init_weights()

    def _init_weights(self):
        nn.init.trunc_normal_(self.cls_token, std=0.02)
        nn.init.trunc_normal_(self.pos_embed, std=0.02)

    def forward(
        self,
        eeg_tokens: torch.Tensor,
        mri_tokens: torch.Tensor,
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Args:
            eeg_tokens: (B, N_eeg, D)
            mri_tokens: (B, N_mri, D)
        Returns:
            cls_repr:   (B, D) -- CLS token output for classification
            eeg_out:    (B, N_eeg, D) -- contextualised EEG token outputs
            mri_out:    (B, N_mri, D) -- contextualised MRI token outputs
        """
        b = eeg_tokens.shape[0]
        n_eeg = eeg_tokens.shape[1]
        n_mri = mri_tokens.shape[1]

        # 1. Asymmetric cross-attention modulation (EEG guided by MRI)
        eeg_tokens = self.gated_cross_attn(eeg_tokens, mri_tokens)

        # 2. Add modality embeddings
        eeg_mod = self.modality_embed(torch.zeros(b, n_eeg, dtype=torch.long, device=eeg_tokens.device))
        mri_mod = self.modality_embed(torch.ones(b, n_mri, dtype=torch.long, device=mri_tokens.device))
        eeg_tokens = eeg_tokens + eeg_mod
        mri_tokens = mri_tokens + mri_mod

        # 3. Build sequence: [CLS] + EEG tokens + MRI tokens
        cls = self.cls_token.expand(b, -1, -1)                   # (B, 1, D)
        seq = torch.cat([cls, eeg_tokens, mri_tokens], dim=1)    # (B, 1+N_eeg+N_mri, D)
        seq_len = seq.shape[1]

        # 4. Add positional embeddings
        if seq_len <= self.pos_embed.shape[1]:
            seq = seq + self.pos_embed[:, :seq_len, :]
        else:
            sin_pos = get_sinusoidal_pos_embed(seq_len, self.embed_dim, seq.device)
            seq = seq + sin_pos

        # 5. Encode
        seq = self.pre_norm(seq)
        seq = self.encoder(seq)
        seq = self.final_norm(seq)

        # Split outputs
        cls_repr = seq[:, 0, :]                                    # (B, D)
        eeg_out = seq[:, 1:1 + n_eeg, :]                          # (B, N_eeg, D)
        mri_out = seq[:, 1 + n_eeg:, :]                           # (B, N_mri, D)

        return cls_repr, eeg_out, mri_out


# ---------------------------------------------------------------------------
# Early Fusion Classifier (end-to-end)
# ---------------------------------------------------------------------------

class EarlyFusionClassifier(nn.Module):
    """End-to-end Early Fusion model with Gated Cross-Attention and Auxiliary Loss.

    Pipeline:
        raw EEG   -> EEGTokenizer  -> eeg_tokens (N_eeg tokens)
        raw MRI   -> MRITokenizer  -> mri_tokens (N_mri tokens)
        [CLS] + GatedCrossAttn(EEG, MRI) + MRI -> TransformerBackbone -> CLS repr -> classification

    Includes asymmetric unimodal auxiliary losses and modality dropout.
    """

    def __init__(
        self,
        # EEG tokenizer
        eeg_channels: int = 32,
        eeg_cnn_channels: Tuple[int, ...] = (64, 128, 256),
        eeg_target_tokens: Optional[int] = 64,
        use_spectrogram: bool = False,
        # MRI tokenizer
        mri_in_channels: int = 1,
        mri_cnn_channels: Tuple[int, ...] = (32, 64, 128, 256),
        mri_target_tokens: Optional[int] = 64,
        # Backbone
        embed_dim: int = 256,
        transformer_depth: int = 6,
        transformer_heads: int = 8,
        ffn_dim: int = 512,
        dropout: float = 0.1,
        max_seq_len: int = 512,
        # Classifier
        num_classes: int = 2,
        classifier_hidden: int = 128,
        # Auxiliary losses
        use_auxiliary_losses: bool = True,
        aux_loss_weight: float = 0.3,
        eeg_aux_weight: float = 0.5,
        mri_aux_weight: float = 0.2,
        # Modality dropout
        mri_dropout_prob: float = 0.3,
    ):
        super().__init__()
        self.use_auxiliary_losses = use_auxiliary_losses
        self.aux_loss_weight = aux_loss_weight
        self.eeg_aux_weight = eeg_aux_weight
        self.mri_aux_weight = mri_aux_weight
        self.mri_dropout_prob = mri_dropout_prob

        # Tokenizers
        self.eeg_tokenizer = EEGTokenizer(
            eeg_channels=eeg_channels,
            cnn_channels=eeg_cnn_channels,
            embed_dim=embed_dim,
            target_tokens=eeg_target_tokens,
            use_spectrogram=use_spectrogram,
        )
        self.mri_tokenizer = MRITokenizer(
            in_channels=mri_in_channels,
            cnn_channels=mri_cnn_channels,
            embed_dim=embed_dim,
            target_tokens=mri_target_tokens,
        )

        # Unified Transformer backbone
        self.backbone = MultimodalTransformerBackbone(
            embed_dim=embed_dim,
            depth=transformer_depth,
            num_heads=transformer_heads,
            ffn_dim=ffn_dim,
            dropout=dropout,
            max_seq_len=max_seq_len,
            num_modalities=2,
        )

        # Main classification head (from CLS token)
        self.classifier = nn.Sequential(
            nn.Linear(embed_dim, classifier_hidden),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(classifier_hidden, num_classes),
        )

        # Auxiliary per-modality classification heads
        if use_auxiliary_losses:
            self.eeg_aux_head = nn.Sequential(
                nn.Linear(embed_dim, classifier_hidden),
                nn.GELU(),
                nn.Dropout(dropout),
                nn.Linear(classifier_hidden, num_classes),
            )
            self.mri_aux_head = nn.Sequential(
                nn.Linear(embed_dim, classifier_hidden),
                nn.GELU(),
                nn.Dropout(dropout),
                nn.Linear(classifier_hidden, num_classes),
            )

    def forward(
        self,
        eeg: torch.Tensor,
        image: torch.Tensor,
    ) -> torch.Tensor:
        """Forward pass returning main classification logits."""
        eeg_tokens = self.eeg_tokenizer(eeg)       # (B, N_eeg, D)
        mri_tokens = self.mri_tokenizer(image)     # (B, N_mri, D)

        # Modality dropout during training: randomly drop MRI tokens
        if self.training and self.mri_dropout_prob > 0:
            b = image.shape[0]
            mask = (torch.rand(b, 1, 1, device=image.device) > self.mri_dropout_prob).float()
            mri_tokens = mri_tokens * mask

        cls_repr, _, _ = self.backbone(eeg_tokens, mri_tokens)
        logits = self.classifier(cls_repr)
        return logits

    def forward_with_aux(
        self,
        eeg: torch.Tensor,
        image: torch.Tensor,
    ) -> Dict[str, torch.Tensor]:
        """Forward pass returning main + auxiliary logits for training."""
        eeg_tokens = self.eeg_tokenizer(eeg)       # (B, N_eeg, D)
        mri_tokens = self.mri_tokenizer(image)     # (B, N_mri, D)

        # Modality dropout during training: randomly drop MRI tokens
        if self.training and self.mri_dropout_prob > 0:
            b = image.shape[0]
            mask = (torch.rand(b, 1, 1, device=image.device) > self.mri_dropout_prob).float()
            mri_tokens = mri_tokens * mask

        cls_repr, eeg_out, mri_out = self.backbone(eeg_tokens, mri_tokens)

        result = {"logits": self.classifier(cls_repr)}

        if self.use_auxiliary_losses:
            # Pool per-modality tokens directly
            eeg_pooled = eeg_tokens.mean(dim=1)       # (B, D) from pure tokenizer
            mri_pooled = mri_tokens.mean(dim=1)       # (B, D) from pure tokenizer
            result["eeg_logits"] = self.eeg_aux_head(eeg_pooled)
            result["mri_logits"] = self.mri_aux_head(mri_pooled)

        return result

    def compute_loss(
        self,
        outputs: Dict[str, torch.Tensor],
        labels: torch.Tensor,
        criterion: nn.Module,
    ) -> Tuple[torch.Tensor, Dict[str, float]]:
        """Compute combined loss with asymmetric unimodal auxiliary weighting."""
        main_loss = criterion(outputs["logits"], labels)
        loss_dict = {"main_loss": main_loss.item()}

        if self.use_auxiliary_losses and "eeg_logits" in outputs:
            eeg_loss = criterion(outputs["eeg_logits"], labels)
            mri_loss = criterion(outputs["mri_logits"], labels)
            total_loss = main_loss + self.eeg_aux_weight * eeg_loss + self.mri_aux_weight * mri_loss
            loss_dict["eeg_aux_loss"] = eeg_loss.item()
            loss_dict["mri_aux_loss"] = mri_loss.item()
            loss_dict["total_loss"] = total_loss.item()
        else:
            total_loss = main_loss
            loss_dict["total_loss"] = total_loss.item()

        return total_loss, loss_dict
