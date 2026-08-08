"""Feature extraction modules."""

import numpy as np
from typing import Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class EEGFeatureExtractor:
    """Extract features from EEG signals."""

    @staticmethod
    def extract_time_domain_features(signal: np.ndarray) -> Dict[str, float]:
        """
        Extract time-domain features.

        Args:
            signal: EEG signal (channels, timepoints) or (timepoints,).

        Returns:
            Dictionary of features.
        """
        if signal.ndim > 1:
            signal = signal.flatten()

        features = {
            "mean": np.mean(signal),
            "std": np.std(signal),
            "max": np.max(signal),
            "min": np.min(signal),
            "rms": np.sqrt(np.mean(signal**2)),
            "skewness": float(np.mean(((signal - np.mean(signal)) / np.std(signal)) ** 3)),
            "kurtosis": float(np.mean(((signal - np.mean(signal)) / np.std(signal)) ** 4) - 3),
        }

        return features

    @staticmethod
    def extract_hjorth_parameters(signal: np.ndarray) -> Dict[str, float]:
        """
        Extract Hjorth parameters.

        Args:
            signal: EEG signal.

        Returns:
            Dictionary with Hjorth parameters.
        """
        if signal.ndim > 1:
            signal = signal.flatten()

        # First derivative
        diff1 = np.diff(signal)
        # Second derivative
        diff2 = np.diff(diff1)

        # Activity
        activity = np.var(signal)

        # Mobility
        mobility = np.sqrt(np.var(diff1) / activity) if activity > 0 else 0

        # Complexity
        if np.var(diff1) > 0:
            complexity = (
                np.sqrt(np.var(diff2) / np.var(diff1)) / mobility
                if mobility > 0 else 0
            )
        else:
            complexity = 0

        return {
            "hjorth_activity": activity,
            "hjorth_mobility": mobility,
            "hjorth_complexity": complexity,
        }

    @staticmethod
    def extract_spectral_features(
        signal: np.ndarray,
        sampling_freq: int = 256,
    ) -> Dict[str, float]:
        """
        Extract spectral features.

        Args:
            signal: EEG signal.
            sampling_freq: Sampling frequency.

        Returns:
            Dictionary of spectral features.
        """
        from scipy.signal import periodogram

        if signal.ndim > 1:
            signal = signal.flatten()

        # Power spectral density
        freqs, psd = periodogram(signal, fs=sampling_freq)

        # Spectral entropy
        psd_norm = psd / np.sum(psd)
        spectral_entropy = -np.sum(psd_norm * np.log2(psd_norm + 1e-10))

        # Peak frequency
        peak_freq = freqs[np.argmax(psd)]

        return {
            "spectral_entropy": spectral_entropy,
            "peak_frequency": peak_freq,
            "mean_frequency": np.sum(freqs * psd) / np.sum(psd),
        }


class SpectralAnalyzer:
    """Spectral analysis utilities."""

    @staticmethod
    def compute_band_power(
        signal: np.ndarray,
        sampling_freq: int,
        bands: Dict[str, Tuple[float, float]] = None,
    ) -> Dict[str, float]:
        """
        Compute band power for frequency bands.

        Args:
            signal: EEG signal.
            sampling_freq: Sampling frequency.
            bands: Frequency bands.

        Returns:
            Dictionary of band powers.
        """
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

        band_powers = {}
        for band_name, (low_freq, high_freq) in bands.items():
            mask = (freqs >= low_freq) & (freqs <= high_freq)
            band_power = np.sum(psd[mask])
            band_powers[f"{band_name}_power"] = band_power

        return band_powers


class TimeFrequencyAnalyzer:
    """Time-frequency analysis utilities."""

    @staticmethod
    def compute_wavelet_transform(
        signal: np.ndarray,
        sampling_freq: int = 256,
        wavelet: str = "morl",
    ) -> np.ndarray:
        """
        Compute continuous wavelet transform.

        Args:
            signal: EEG signal.
            sampling_freq: Sampling frequency.
            wavelet: Wavelet type.

        Returns:
            Wavelet coefficients.
        """
        try:
            import pywt

            if signal.ndim > 1:
                signal = signal.flatten()

            scales = np.arange(1, 128)
            coefficients = pywt.cwt(signal, scales, wavelet)

            return coefficients[0]  # Return magnitudes
        except ImportError:
            logger.warning("PyWavelets not available")
            return np.array([])


class ConnectivityAnalyzer:
    """Functional connectivity analysis."""

    @staticmethod
    def compute_correlation_matrix(
        data: np.ndarray,
    ) -> np.ndarray:
        """
        Compute correlation matrix.

        Args:
            data: EEG data (channels, timepoints).

        Returns:
            Correlation matrix (channels, channels).
        """
        return np.corrcoef(data)

    @staticmethod
    def compute_coherence_matrix(
        data: np.ndarray,
        sampling_freq: int = 256,
    ) -> np.ndarray:
        """
        Compute coherence matrix.

        Args:
            data: EEG data (channels, timepoints).
            sampling_freq: Sampling frequency.

        Returns:
            Coherence matrix (channels, channels).
        """
        from scipy.signal import coherence

        n_channels = data.shape[0]
        coherence_matrix = np.zeros((n_channels, n_channels))

        for i in range(n_channels):
            for j in range(i + 1, n_channels):
                freqs, coh = coherence(data[i], data[j], fs=sampling_freq)
                coherence_matrix[i, j] = np.mean(coh)
                coherence_matrix[j, i] = coherence_matrix[i, j]

        return coherence_matrix


class ImagingFeatureExtractor:
    """Extract features from imaging data."""

    @staticmethod
    def compute_texture_features(
        image: np.ndarray,
    ) -> Dict[str, float]:
        """
        Compute texture features (simplified).

        Args:
            image: 3D image volume.

        Returns:
            Dictionary of texture features.
        """
        features = {
            "mean_intensity": np.mean(image),
            "std_intensity": np.std(image),
            "skewness": float(np.mean(((image - np.mean(image)) / np.std(image)) ** 3)),
            "kurtosis": float(np.mean(((image - np.mean(image)) / np.std(image)) ** 4) - 3),
        }

        return features
