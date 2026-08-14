"""Common preprocessing utilities."""

import numpy as np
import torch
from typing import Tuple, Union


def normalize_tensor(
    tensor: Union[np.ndarray, torch.Tensor],
    method: str = "min_max",
    min_val: float = 0,
    max_val: float = 1,
) -> Union[np.ndarray, torch.Tensor]:
    """
    Normalize tensor to specified range.

    Args:
        tensor: Input tensor.
        method: Normalization method ('min_max', 'zscore', 'robust').
        min_val: Minimum value for min_max normalization.
        max_val: Maximum value for min_max normalization.

    Returns:
        Normalized tensor.
    """
    is_torch = isinstance(tensor, torch.Tensor)

    if is_torch:
        tensor = tensor.numpy()

    if method == "min_max":
        tensor_min = np.min(tensor)
        tensor_max = np.max(tensor)
        if tensor_max == tensor_min:
            normalized = np.zeros_like(tensor)
        else:
            normalized = (tensor - tensor_min) / (tensor_max - tensor_min)
            normalized = normalized * (max_val - min_val) + min_val

    elif method == "zscore":
        mean = np.mean(tensor)
        std = np.std(tensor)
        if std == 0:
            normalized = np.zeros_like(tensor)
        else:
            normalized = (tensor - mean) / std

    elif method == "robust":
        q75, q25 = np.percentile(tensor, [75, 25])
        iqr = q75 - q25
        if iqr == 0:
            normalized = np.zeros_like(tensor)
        else:
            median = np.median(tensor)
            normalized = (tensor - median) / iqr

    else:
        raise ValueError(f"Unknown normalization method: {method}")

    if is_torch:
        normalized = torch.FloatTensor(normalized)

    return normalized


def resample_volume(
    volume: Union[np.ndarray, torch.Tensor],
    target_shape: Tuple[int, int, int],
    order: int = 1,
) -> Union[np.ndarray, torch.Tensor]:
    """
    Resample 3D volume to target shape.

    Args:
        volume: 3D volume.
        target_shape: Target shape (depth, height, width).
        order: Interpolation order (0=nearest, 1=linear, 3=cubic).

    Returns:
        Resampled volume.
    """
    from scipy.ndimage import zoom

    is_torch = isinstance(volume, torch.Tensor)

    if is_torch:
        volume = volume.numpy()

    # Compute zoom factors
    current_shape = volume.shape
    zoom_factors = tuple(t / c for t, c in zip(target_shape, current_shape))

    # Apply zoom
    resampled = zoom(volume, zoom_factors, order=order)

    if is_torch:
        resampled = torch.FloatTensor(resampled)

    return resampled


def pad_or_crop(
    volume: Union[np.ndarray, torch.Tensor],
    target_shape: Tuple[int, int, int],
) -> Union[np.ndarray, torch.Tensor]:
    """
    Pad or crop volume to target shape.

    Args:
        volume: Input volume.
        target_shape: Target shape.

    Returns:
        Padded or cropped volume.
    """
    is_torch = isinstance(volume, torch.Tensor)

    if is_torch:
        volume = volume.numpy()

    current_shape = volume.shape
    result = np.zeros(target_shape)

    # Determine slices for copying
    slices = tuple(
        slice(0, min(current_shape[i], target_shape[i]))
        for i in range(len(target_shape))
    )

    result_slices = tuple(
        slice(0, min(current_shape[i], target_shape[i]))
        for i in range(len(target_shape))
    )

    result[result_slices] = volume[slices]

    return result


def apply_bandpass_filter(
    data: np.ndarray,
    low_freq: float = 0.5,
    high_freq: float = 45.0,
    sampling_freq: float = 256.0,
    order: int = 5,
) -> np.ndarray:
    """
    Apply Butterworth bandpass filter to EEG signal.

    Args:
        data: Signal array (channels, timepoints).
        low_freq: Low cutoff frequency in Hz.
        high_freq: High cutoff frequency in Hz.
        sampling_freq: Sampling rate in Hz.
        order: Filter order.

    Returns:
        Filtered signal array.
    """
    from scipy.signal import butter, filtfilt

    nyquist_freq = sampling_freq / 2.0
    low = np.clip(low_freq / nyquist_freq, 0.001, 0.999)
    high = np.clip(high_freq / nyquist_freq, 0.001, 0.999)

    b, a = butter(order, [low, high], btype="band")
    return filtfilt(b, a, data, axis=-1)


def resample_signal(
    data: np.ndarray,
    original_freq: float = 500.0,
    target_freq: float = 256.0,
) -> np.ndarray:
    """
    Resample 1D/2D signal to target sampling frequency.

    Args:
        data: Signal array (channels, timepoints) or (timepoints,).
        original_freq: Original sampling rate in Hz.
        target_freq: Target sampling rate in Hz.

    Returns:
        Resampled signal array.
    """
    from scipy.signal import resample

    num_samples = int(data.shape[-1] * target_freq / original_freq)
    return resample(data, num_samples, axis=-1)

