"""Connectivity visualization."""

import numpy as np
import matplotlib.pyplot as plt
import networkx as nx
from typing import Optional


class ConnectivityVisualizer:
    """Visualize brain connectivity."""

    @staticmethod
    def plot_connectivity_matrix(
        connectivity: np.ndarray,
        roi_names: Optional[list] = None,
        save_path: Optional[str] = None,
    ) -> plt.Figure:
        """
        Plot connectivity matrix as heatmap.

        Args:
            connectivity: Connectivity matrix (n_rois, n_rois).
            roi_names: ROI names.
            save_path: Path to save figure.

        Returns:
            Figure.
        """
        import seaborn as sns

        fig, ax = plt.subplots(figsize=(10, 8))

        sns.heatmap(
            connectivity,
            cmap="coolwarm",
            center=0,
            ax=ax,
            xticklabels=roi_names if roi_names else True,
            yticklabels=roi_names if roi_names else True,
        )

        ax.set_title("Functional Connectivity Matrix")
        plt.tight_layout()

        if save_path:
            fig.savefig(save_path, dpi=300)

        return fig

    @staticmethod
    def plot_connectivity_network(
        connectivity: np.ndarray,
        threshold: float = 0.3,
        roi_names: Optional[list] = None,
        save_path: Optional[str] = None,
    ) -> plt.Figure:
        """
        Plot connectivity as network graph.

        Args:
            connectivity: Connectivity matrix.
            threshold: Threshold for edges.
            roi_names: ROI names.
            save_path: Path to save figure.

        Returns:
            Figure.
        """
        # Create graph
        G = nx.Graph()

        n_rois = connectivity.shape[0]
        for i in range(n_rois):
            G.add_node(i)

        # Add edges above threshold
        for i in range(n_rois):
            for j in range(i + 1, n_rois):
                if np.abs(connectivity[i, j]) > threshold:
                    G.add_edge(i, j, weight=connectivity[i, j])

        # Plot
        fig, ax = plt.subplots(figsize=(10, 10))

        pos = nx.spring_layout(G)
        nx.draw_networkx_nodes(G, pos, ax=ax, node_color="lightblue")
        nx.draw_networkx_edges(G, pos, ax=ax, alpha=0.5)

        if roi_names:
            labels = {i: roi_names[i] for i in range(len(roi_names))}
        else:
            labels = {i: str(i) for i in range(n_rois)}

        nx.draw_networkx_labels(G, pos, labels, ax=ax)

        ax.set_title("Connectivity Network")
        ax.axis("off")

        plt.tight_layout()

        if save_path:
            fig.savefig(save_path, dpi=300)

        return fig
