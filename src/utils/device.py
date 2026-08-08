"""Device management utilities."""

import torch
import logging
from typing import Literal

logger = logging.getLogger(__name__)


def get_device(device_type: Literal["auto", "cuda", "cpu"] = "auto") -> torch.device:
    """
    Get the appropriate device for PyTorch computations.

    Args:
        device_type: Device type ('auto', 'cuda', or 'cpu').

    Returns:
        torch.device: PyTorch device object.

    Example:
        >>> device = get_device()
        >>> print(device)
        cuda:0
    """
    if device_type == "auto":
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    elif device_type == "cuda":
        if not torch.cuda.is_available():
            logger.warning("CUDA not available. Falling back to CPU.")
            device = torch.device("cpu")
        else:
            device = torch.device("cuda")
    elif device_type == "cpu":
        device = torch.device("cpu")
    else:
        raise ValueError(f"Unknown device type: {device_type}")

    logger.info(f"Using device: {device}")

    if device.type == "cuda":
        logger.info(f"CUDA Device: {torch.cuda.get_device_name(0)}")
        logger.info(f"CUDA Capability: {torch.cuda.get_device_capability()}")
        logger.info(f"Total GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")

    return device


def get_device_info() -> dict:
    """
    Get detailed information about the available device.

    Returns:
        dict: Device information.
    """
    info = {
        "device_type": "cuda" if torch.cuda.is_available() else "cpu",
        "cuda_available": torch.cuda.is_available(),
        "cuda_version": torch.version.cuda if torch.cuda.is_available() else None,
        "cudnn_version": torch.backends.cudnn.version() if torch.cuda.is_available() else None,
        "device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
    }

    if torch.cuda.is_available():
        info["device_name"] = torch.cuda.get_device_name(0)
        info["total_memory_gb"] = torch.cuda.get_device_properties(0).total_memory / 1e9

    return info
