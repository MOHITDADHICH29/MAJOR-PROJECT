"""Spectral features extraction."""

import numpy as np
from typing import Dict


class SpectralAnalyzer:
    """Additional spectral analysis methods."""

    @staticmethod
    def compute_relative_band_power(
        signal: np.ndarray,
        sampling_freq: int,
        bands: Dict[str, tuple] = None,
    ) -> Dict[str, float]:
        """Compute relative band power."""
        if bands is None:
            bands = {
                "delta": (0.5, 4),
                "theta": (4, 8),
                "alpha": (8, 13),
                "beta": (13, 30),
                "gamma": (30, 45),
            }

        from scipy.signal import periodogram

        if signal.ndim > 1:
            signal = signal.flatten()

        freqs, psd = periodogram(signal, fs=sampling_freq)
        total_power = np.sum(psd)

        relative_powers = {}
        for band_name, (low_freq, high_freq) in bands.items():
            mask = (freqs >= low_freq) & (freqs <= high_freq)
            band_power = np.sum(psd[mask])
            relative_power = band_power / total_power if total_power > 0 else 0
            relative_powers[f"{band_name}_relative_power"] = relative_power

        return relative_powers
