"""EEG preprocessing module."""

import numpy as np
import logging
from typing import Dict, Tuple, Optional, List
from pathlib import Path

logger = logging.getLogger(__name__)


class EEGPreprocessor:
    """
    EEG preprocessing pipeline.

    Supports multiple file formats: .edf, .set, .fif, .bdf, .vhdr, .eea, .csv, .tsv
    """

    SUPPORTED_FORMATS = [".edf", ".set", ".fif", ".bdf", ".vhdr", ".eea", ".csv", ".tsv"]

    def __init__(self, config: Dict = None):
        """
        Initialize EEG preprocessor.

        Args:
            config: Configuration dictionary with EEG parameters.
        """
        self.config = config or {}
        self.data = None
        self.sampling_freq = self.config.get("sampling_frequency", 256)
        self.low_freq = self.config.get("low_frequency", 0.5)
        self.high_freq = self.config.get("high_frequency", 45)
        self.notch_freq = self.config.get("notch_frequency", 50)

    def load_eeg_file(self, file_path: str) -> Tuple[np.ndarray, int]:
        """
        Load EEG file from various formats.

        Args:
            file_path: Path to EEG file.

        Returns:
            Tuple of (data, sampling_frequency).
        """
        file_path = Path(file_path)

        if not file_path.exists():
            raise FileNotFoundError(f"EEG file not found: {file_path}")

        file_ext = file_path.suffix.lower()

        if file_ext == ".edf":
            return self._load_edf(file_path)
        elif file_ext == ".fif":
            return self._load_fif(file_path)
        elif file_ext == ".eea":
            return self._load_eea(file_path)
        elif file_ext in [".csv", ".tsv"]:
            return self._load_csv_tsv(file_path)
        else:
            logger.warning(f"Format {file_ext} requires MNE-Python. Attempting to load...")
            return self._load_mne_format(file_path)

    def _load_edf(self, file_path: Path) -> Tuple[np.ndarray, int]:
        """Load EDF file using mne or pyedflib."""
        try:
            import mne

            raw = mne.io.read_raw_edf(str(file_path), preload=True)
            data = raw.get_data()
            sampling_freq = raw.info["sfreq"]
            logger.info(f"Loaded EDF file: {file_path}")
            return data, sampling_freq
        except ImportError:
            logger.error("MNE-Python required for EDF files")
            raise

    def _load_fif(self, file_path: Path) -> Tuple[np.ndarray, int]:
        """Load FIF file using mne."""
        try:
            import mne

            raw = mne.io.read_raw_fif(str(file_path), preload=True)
            data = raw.get_data()
            sampling_freq = raw.info["sfreq"]
            logger.info(f"Loaded FIF file: {file_path}")
            return data, sampling_freq
        except ImportError:
            logger.error("MNE-Python required for FIF files")
            raise

    def _load_eea(self, file_path: Path) -> Tuple[np.ndarray, int]:
        """Load EEA file format (NetStation EGI format)."""
        try:
            import scipy.io as sio
            
            # Try to load as MATLAB file first
            try:
                mat_data = sio.loadmat(str(file_path))
                for key in mat_data:
                    if not key.startswith('__'):
                        data = mat_data[key]
                        if isinstance(data, np.ndarray) and data.ndim >= 2:
                            logger.info(f"Loaded EEA file (MATLAB): {file_path}")
                            return data, self.sampling_freq
            except:
                pass
            
            # Try MNE-Python
            import mne
            raw = mne.io.read_raw(str(file_path), preload=True)
            data = raw.get_data()
            sampling_freq = raw.info["sfreq"]
            logger.info(f"Loaded EEA file (MNE): {file_path}")
            return data, sampling_freq
            
        except Exception as e:
            logger.warning(f"Could not load EEA via standard methods: {e}. Trying binary reader.")
            return self._load_eea_binary(file_path)
    
    def _load_eea_binary(self, file_path: Path) -> Tuple[np.ndarray, int]:
        """Load EEA as raw binary file (fallback for NetStation format)."""
        try:
            data = np.fromfile(str(file_path), dtype=np.float32)
            n_channels = 19
            n_samples = len(data) // n_channels
            if n_samples == 0:
                # Try float64
                data = np.fromfile(str(file_path), dtype=np.float64)
                n_samples = len(data) // n_channels
            data = data[:n_channels * n_samples].reshape(n_channels, n_samples)
            logger.info(f"Loaded EEA (binary): {file_path} - Shape: {data.shape}")
            return data, self.sampling_freq
        except Exception as e:
            logger.error(f"Failed to load EEA binary file: {e}")
            raise

    def _load_csv_tsv(self, file_path: Path) -> Tuple[np.ndarray, int]:
        """Load CSV/TSV file."""
        import pandas as pd

        delimiter = "\t" if file_path.suffix == ".tsv" else ","
        df = pd.read_csv(file_path, delimiter=delimiter)
        data = df.values.T  # Transpose to get (channels, timepoints)
        logger.info(f"Loaded CSV/TSV file: {file_path}")
        return data, self.sampling_freq

    def _load_mne_format(self, file_path: Path) -> Tuple[np.ndarray, int]:
        """Load file using MNE."""
        try:
            import mne

            raw = mne.io.read_raw(str(file_path), preload=True)
            data = raw.get_data()
            sampling_freq = raw.info["sfreq"]
            logger.info(f"Loaded file using MNE: {file_path}")
            return data, sampling_freq
        except Exception as e:
            logger.error(f"Failed to load file: {e}")
            raise

    def apply_bandpass_filter(
        self,
        data: np.ndarray,
        low_freq: float = None,
        high_freq: float = None,
        order: int = 5,
    ) -> np.ndarray:
        """
        Apply bandpass filter to EEG data.

        Args:
            data: EEG data (channels, timepoints).
            low_freq: Low frequency cutoff.
            high_freq: High frequency cutoff.
            order: Filter order.

        Returns:
            Filtered data.
        """
        from scipy.signal import butter, filtfilt

        low_freq = low_freq or self.low_freq
        high_freq = high_freq or self.high_freq

        nyquist_freq = self.sampling_freq / 2
        low = low_freq / nyquist_freq
        high = high_freq / nyquist_freq

        low = np.clip(low, 0.001, 0.999)
        high = np.clip(high, 0.001, 0.999)

        b, a = butter(order, [low, high], btype="band")
        filtered = filtfilt(b, a, data, axis=-1)

        logger.info(f"Applied bandpass filter: {low_freq}-{high_freq} Hz")
        return filtered

    def apply_notch_filter(
        self,
        data: np.ndarray,
        notch_freq: float = None,
        quality: float = 30,
    ) -> np.ndarray:
        """
        Apply notch filter to remove powerline interference.

        Args:
            data: EEG data.
            notch_freq: Frequency to remove (typically 50 or 60 Hz).
            quality: Quality factor.

        Returns:
            Filtered data.
        """
        from scipy.signal import iirnotch, filtfilt

        notch_freq = notch_freq or self.notch_freq
        nyquist_freq = self.sampling_freq / 2

        if notch_freq >= nyquist_freq:
            logger.warning(f"Notch frequency {notch_freq} >= Nyquist frequency. Skipping.")
            return data

        b, a = iirnotch(notch_freq, quality, self.sampling_freq)
        filtered = filtfilt(b, a, data, axis=-1)

        logger.info(f"Applied notch filter at {notch_freq} Hz")
        return filtered

    def resample(
        self,
        data: np.ndarray,
        target_freq: int,
    ) -> Tuple[np.ndarray, int]:
        """
        Resample EEG data.

        Args:
            data: EEG data.
            target_freq: Target sampling frequency.

        Returns:
            Tuple of (resampled_data, new_sampling_freq).
        """
        from scipy.signal import resample

        if target_freq == self.sampling_freq:
            return data, self.sampling_freq

        num_samples = int(data.shape[1] * target_freq / self.sampling_freq)
        resampled = resample(data, num_samples, axis=-1)

        logger.info(f"Resampled from {self.sampling_freq} Hz to {target_freq} Hz")
        return resampled, target_freq

    def normalize(
        self,
        data: np.ndarray,
        method: str = "zscore",
    ) -> np.ndarray:
        """
        Normalize EEG data.

        Args:
            data: EEG data.
            method: Normalization method ('zscore', 'min_max').

        Returns:
            Normalized data.
        """
        if method == "zscore":
            mean = np.mean(data, axis=1, keepdims=True)
            std = np.std(data, axis=1, keepdims=True)
            normalized = (data - mean) / (std + 1e-8)
        elif method == "min_max":
            data_min = np.min(data, axis=1, keepdims=True)
            data_max = np.max(data, axis=1, keepdims=True)
            normalized = (data - data_min) / (data_max - data_min + 1e-8)
        else:
            raise ValueError(f"Unknown normalization method: {method}")

        logger.info(f"Applied {method} normalization")
        return normalized

    def preprocess_pipeline(
        self,
        data: np.ndarray,
        apply_bandpass: bool = True,
        apply_notch: bool = True,
        apply_normalization: bool = True,
    ) -> np.ndarray:
        """
        Apply complete preprocessing pipeline.

        Args:
            data: Raw EEG data.
            apply_bandpass: Apply bandpass filtering.
            apply_notch: Apply notch filtering.
            apply_normalization: Apply normalization.

        Returns:
            Preprocessed data.
        """
        logger.info("Starting EEG preprocessing pipeline")

        if apply_notch:
            data = self.apply_notch_filter(data)

        if apply_bandpass:
            data = self.apply_bandpass_filter(data)

        if apply_normalization:
            data = self.normalize(data)

        logger.info("EEG preprocessing complete")
        return data
