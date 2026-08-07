import numpy as np
from nilearn.masking import compute_brain_mask
from scipy.ndimage import zoom


def skull_strip_volume(volume):
    """Placeholder skull-stripping using nilearn brain mask estimation."""
    try:
        mask = compute_brain_mask(volume)
        stripped = volume * mask
        return stripped.astype(np.float32)
    except Exception:
        return volume.astype(np.float32)


def resample_volume(volume, target_shape=(64, 64, 64)):
    """Resample a 3D volume to the requested shape."""
    volume = volume.astype(np.float32)
    zoom_factors = [t / float(s) for s, t in zip(volume.shape, target_shape)]
    resized = zoom(volume, zoom_factors, order=1)
    return resized.astype(np.float32)


def normalize_intensity(volume, method="zscore"):
    """Normalize image intensity globally or using a simple min-max transformation."""
    volume = volume.astype(np.float32)
    if method == "minmax":
        vmin, vmax = np.min(volume), np.max(volume)
        if vmax - vmin < 1e-6:
            return np.zeros_like(volume, dtype=np.float32)
        return ((volume - vmin) / (vmax - vmin)).astype(np.float32)
    mean = np.mean(volume)
    std = np.std(volume)
    if std < 1e-6:
        std = 1.0
    return ((volume - mean) / std).astype(np.float32)
