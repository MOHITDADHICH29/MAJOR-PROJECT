import numpy as np
from scipy.signal import butter, filtfilt, stft


def bandpass_filter_eeg(data, sfreq, low=0.5, high=45.0, order=5):
    """Apply a bandpass filter to EEG data per channel."""
    nyquist = 0.5 * sfreq
    low_cut = low / nyquist
    high_cut = high / nyquist
    b, a = butter(order, [low_cut, high_cut], btype="band")
    filtered = np.zeros_like(data, dtype=np.float32)
    for idx in range(data.shape[0]):
        filtered[idx] = filtfilt(b, a, data[idx], padlen=3 * (max(len(a), len(b)) - 1))
    return filtered


def artifact_rejection_amplitude(data, threshold_uv=150.0):
    """Reject or clip EEG samples with large amplitude artifacts."""
    cleaned = np.copy(data)
    cleaned[np.abs(cleaned) > threshold_uv] = np.sign(cleaned[np.abs(cleaned) > threshold_uv]) * threshold_uv
    return cleaned


def zscore_normalize(data):
    """Z-score normalize each EEG channel separately."""
    mean = np.mean(data, axis=1, keepdims=True)
    std = np.std(data, axis=1, keepdims=True)
    std[std == 0.0] = 1.0
    return ((data - mean) / std).astype(np.float32)


def compute_spectrogram(data, sfreq, n_fft=256, hop_length=128, n_overlap=None):
    """Compute a spectrogram from EEG data per channel."""
    if n_overlap is None:
        n_overlap = n_fft // 2
    spectrograms = []
    for channel in data:
        f, t, Zxx = stft(channel, fs=sfreq, nperseg=n_fft, noverlap=n_overlap)
        mag = np.abs(Zxx).astype(np.float32)
        spectrograms.append(mag)
    spectrogram = np.stack(spectrograms, axis=0)
    return spectrogram
