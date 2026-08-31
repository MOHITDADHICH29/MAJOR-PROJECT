"""Legacy multimodal classification models (Late Fusion components)."""

import math
import torch
import torch.nn as nn


class EEGFeatureExtractor(nn.Module):
    """Extract EEG embeddings with a 1D CNN + Bi-LSTM pipeline."""

    def __init__(
        self,
        eeg_channels=32,
        use_spectrogram=False,
        cnn_channels=(32, 64, 128),
        lstm_hidden=64,
        embedding_dim=128,
    ):
        super().__init__()
        self.use_spectrogram = use_spectrogram
        self.eeg_channels = eeg_channels
        self.cnn_channels = cnn_channels
        self.embedding_dim = embedding_dim

        if self.use_spectrogram:
            self.cnn = nn.Sequential(
                nn.Conv2d(eeg_channels, cnn_channels[0], kernel_size=3, padding=1),
                nn.BatchNorm2d(cnn_channels[0]),
                nn.ReLU(inplace=True),
                nn.MaxPool2d(kernel_size=(2, 2)),
                nn.Conv2d(cnn_channels[0], cnn_channels[1], kernel_size=3, padding=1),
                nn.BatchNorm2d(cnn_channels[1]),
                nn.ReLU(inplace=True),
                nn.MaxPool2d(kernel_size=(2, 2)),
                nn.Conv2d(cnn_channels[1], cnn_channels[2], kernel_size=3, padding=1),
                nn.BatchNorm2d(cnn_channels[2]),
                nn.ReLU(inplace=True),
            )
            lstm_input_dim = cnn_channels[-1]
        else:
            self.cnn = nn.Sequential(
                nn.Conv1d(eeg_channels, cnn_channels[0], kernel_size=7, padding=3),
                nn.BatchNorm1d(cnn_channels[0]),
                nn.ReLU(inplace=True),
                nn.MaxPool1d(kernel_size=2),
                nn.Conv1d(cnn_channels[0], cnn_channels[1], kernel_size=5, padding=2),
                nn.BatchNorm1d(cnn_channels[1]),
                nn.ReLU(inplace=True),
                nn.MaxPool1d(kernel_size=2),
                nn.Conv1d(cnn_channels[1], cnn_channels[2], kernel_size=3, padding=1),
                nn.BatchNorm1d(cnn_channels[2]),
                nn.ReLU(inplace=True),
            )
            lstm_input_dim = cnn_channels[-1]

        self.lstm = nn.LSTM(
            input_size=lstm_input_dim,
            hidden_size=lstm_hidden,
            num_layers=1,
            batch_first=True,
            bidirectional=True,
        )
        self.embedding = nn.Linear(2 * lstm_hidden, embedding_dim)

    def forward(self, x):
        if self.use_spectrogram:
            # Input shape: (B, C, F, T)
            x = self.cnn(x)
            x = nn.functional.adaptive_avg_pool2d(x, output_size=(1, x.shape[-1]))
            x = x.squeeze(2)
            x = x.permute(0, 2, 1)
        else:
            # Input shape: (B, C, T)
            x = self.cnn(x)
            x = x.permute(0, 2, 1)

        _, (hidden, _) = self.lstm(x)
        hidden_cat = torch.cat([hidden[-2], hidden[-1]], dim=1)
        embedding = self.embedding(hidden_cat)
        return embedding


class ViT3D(nn.Module):
    """A small Vision Transformer for 3D volumes."""

    def __init__(
        self,
        in_channels=1,
        patch_size=16,
        embed_dim=128,
        depth=4,
        num_heads=4,
    ):
        super().__init__()
        self.patch_size = patch_size
        self.embed_dim = embed_dim
        self.patch_proj = nn.Conv3d(
            in_channels,
            embed_dim,
            kernel_size=patch_size,
            stride=patch_size,
        )
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, 1 + 64, embed_dim))
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embed_dim,
            nhead=num_heads,
            dim_feedforward=embed_dim * 2,
            activation="gelu",
            batch_first=True,
        )
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers=depth)
        self.norm = nn.LayerNorm(embed_dim)
        self._init_weights()

    def _init_weights(self):
        nn.init.trunc_normal_(self.pos_embed, std=0.02)
        nn.init.normal_(self.cls_token, std=0.02)

    def forward(self, x):
        x = self.patch_proj(x)
        b, c, d, h, w = x.shape
        x = x.flatten(2).transpose(1, 2)
        cls = self.cls_token.expand(b, -1, -1)
        x = torch.cat([cls, x], dim=1)
        x = x + self.pos_embed[:, : x.size(1), :]
        x = self.encoder(x)
        x = self.norm(x[:, 0])
        return x


class ImagingFeatureExtractor(nn.Module):
    """Extract imaging embeddings using 3D CNN or optional ViT3D backbone."""

    def __init__(
        self,
        backbone="cnn3d",
        in_channels=1,
        feature_dim=128,
        cnn_channels=(16, 32, 64, 128),
        vit_patch_size=16,
        vit_depth=4,
        vit_heads=4,
    ):
        super().__init__()
        self.backbone = backbone
        if backbone == "cnn3d":
            self.encoder = nn.Sequential(
                nn.Conv3d(in_channels, cnn_channels[0], kernel_size=3, padding=1),
                nn.BatchNorm3d(cnn_channels[0]),
                nn.ReLU(inplace=True),
                nn.MaxPool3d(2),
                nn.Conv3d(cnn_channels[0], cnn_channels[1], kernel_size=3, padding=1),
                nn.BatchNorm3d(cnn_channels[1]),
                nn.ReLU(inplace=True),
                nn.MaxPool3d(2),
                nn.Conv3d(cnn_channels[1], cnn_channels[2], kernel_size=3, padding=1),
                nn.BatchNorm3d(cnn_channels[2]),
                nn.ReLU(inplace=True),
                nn.MaxPool3d(2),
                nn.Conv3d(cnn_channels[2], cnn_channels[3], kernel_size=3, padding=1),
                nn.BatchNorm3d(cnn_channels[3]),
                nn.ReLU(inplace=True),
                nn.AdaptiveAvgPool3d((1, 1, 1)),
            )
            self.project = nn.Linear(cnn_channels[3], feature_dim)
        elif backbone == "vit3d":
            self.encoder = ViT3D(
                in_channels=in_channels,
                patch_size=vit_patch_size,
                embed_dim=feature_dim,
                depth=vit_depth,
                num_heads=vit_heads,
            )
        else:
            raise ValueError(f"Unsupported imaging backbone: {backbone}")

    def forward(self, x):
        if self.backbone == "cnn3d":
            x = self.encoder(x)
            x = x.flatten(start_dim=1)
            x = self.project(x)
            return x
        return self.encoder(x)


class FusionModule(nn.Module):
    """Fuse EEG and imaging embeddings using concatenation or cross-attention."""

    def __init__(self, strategy="concat", embed_dim=128, joint_dim=256, num_heads=4):
        super().__init__()
        self.strategy = strategy
        if strategy == "concat":
            self.project = nn.Sequential(
                nn.Linear(embed_dim * 2, joint_dim),
                nn.ReLU(inplace=True),
                nn.Dropout(0.2),
                nn.Linear(joint_dim, joint_dim),
                nn.ReLU(inplace=True),
            )
        elif strategy == "cross_attention":
            self.attn_eeg_to_img = nn.MultiheadAttention(embed_dim, num_heads, batch_first=True)
            self.attn_img_to_eeg = nn.MultiheadAttention(embed_dim, num_heads, batch_first=True)
            self.project = nn.Sequential(
                nn.Linear(embed_dim * 2, joint_dim),
                nn.ReLU(inplace=True),
                nn.Dropout(0.2),
                nn.Linear(joint_dim, joint_dim),
                nn.ReLU(inplace=True),
            )
        else:
            raise ValueError(f"Unsupported fusion strategy: {strategy}")

    def forward(self, eeg_embedding, imaging_embedding):
        if self.strategy == "concat":
            joint = torch.cat([eeg_embedding, imaging_embedding], dim=1)
            return self.project(joint)

        eeg_seq = eeg_embedding.unsqueeze(1)
        img_seq = imaging_embedding.unsqueeze(1)
        attended_eeg, _ = self.attn_eeg_to_img(eeg_seq, img_seq, img_seq)
        attended_img, _ = self.attn_img_to_eeg(img_seq, eeg_seq, eeg_seq)
        joint = torch.cat([attended_eeg.squeeze(1), attended_img.squeeze(1)], dim=1)
        return self.project(joint)


class Classifier(nn.Module):
    """Classification head over the fused multimodal representation."""

    def __init__(
        self,
        joint_dim=256,
        hidden_dim=128,
        dropout=0.3,
        classifier_type="mlp",
        transformer_layers=2,
        transformer_heads=4,
    ):
        super().__init__()
        self.classifier_type = classifier_type
        if classifier_type == "mlp":
            self.head = nn.Sequential(
                nn.Linear(joint_dim, hidden_dim),
                nn.ReLU(inplace=True),
                nn.Dropout(dropout),
                nn.Linear(hidden_dim, 2),
            )
        elif classifier_type == "transformer":
            self.cls_token = nn.Parameter(torch.zeros(1, 1, joint_dim))
            self.pos_embed = nn.Parameter(torch.zeros(1, 2, joint_dim))
            encoder_layer = nn.TransformerEncoderLayer(
                d_model=joint_dim,
                nhead=transformer_heads,
                dim_feedforward=joint_dim * 2,
                activation="gelu",
                batch_first=True,
            )
            self.encoder = nn.TransformerEncoder(encoder_layer, num_layers=transformer_layers)
            self.output = nn.Linear(joint_dim, 2)
            nn.init.trunc_normal_(self.pos_embed, std=0.02)
            nn.init.normal_(self.cls_token, std=0.02)
        else:
            raise ValueError(f"Unsupported classifier type: {classifier_type}")

    def forward(self, joint_repr):
        if self.classifier_type == "mlp":
            return self.head(joint_repr)

        b = joint_repr.shape[0]
        cls = self.cls_token.expand(b, -1, -1)
        seq = torch.cat([cls, joint_repr.unsqueeze(1)], dim=1)
        seq = seq + self.pos_embed
        encoded = self.encoder(seq)
        out = self.output(encoded[:, 0])
        return out


class MultimodalSZClassifier(nn.Module):
    """End-to-end multimodal classifier wrapping EEG, imaging, fusion, and classification."""

    def __init__(
        self,
        eeg_extractor: EEGFeatureExtractor,
        imaging_extractor: ImagingFeatureExtractor,
        fusion_module: FusionModule,
        classifier: Classifier,
    ):
        super().__init__()
        self.eeg_extractor = eeg_extractor
        self.imaging_extractor = imaging_extractor
        self.fusion_module = fusion_module
        self.classifier = classifier

    def forward(self, eeg, image):
        eeg_embed = self.eeg_extractor(eeg)
        img_embed = self.imaging_extractor(image)
        joint = self.fusion_module(eeg_embed, img_embed)
        logits = self.classifier(joint)
        return logits
