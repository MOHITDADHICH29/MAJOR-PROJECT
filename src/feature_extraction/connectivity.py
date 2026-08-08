"""Connectivity analysis."""

import numpy as np
from typing import Dict


class ConnectivityAnalyzer:
    """Functional and structural connectivity."""

    @staticmethod
    def compute_plv(data: np.ndarray, sampling_freq: int = 256) -> np.ndarray:
        """Compute Phase Locking Value."""
        from scipy.signal import hilbert

        n_channels = data.shape[0]
        plv_matrix = np.zeros((n_channels, n_channels))

        for i in range(n_channels):
            for j in range(i + 1, n_channels):
                analytic_signal_i = hilbert(data[i])
                analytic_signal_j = hilbert(data[j])

                phase_diff = np.angle(analytic_signal_i) - np.angle(analytic_signal_j)
                plv = np.abs(np.mean(np.exp(1j * phase_diff)))

                plv_matrix[i, j] = plv
                plv_matrix[j, i] = plv

        return plv_matrix
