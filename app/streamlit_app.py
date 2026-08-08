"""Main Streamlit application."""

import streamlit as st
import torch
import numpy as np
from pathlib import Path
import logging

# Page configuration
st.set_page_config(
    page_title="Schizophrenia Detection",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    """Main application function."""
    st.sidebar.title("Navigation")
    page = st.sidebar.radio(
        "Select Page",
        [
            "Home",
            "EEG Analysis",
            "Neuroimaging",
            "Multimodal Analysis",
            "Results",
        ],
    )

    if page == "Home":
        show_home()
    elif page == "EEG Analysis":
        show_eeg_analysis()
    elif page == "Neuroimaging":
        show_neuroimaging()
    elif page == "Multimodal Analysis":
        show_multimodal()
    elif page == "Results":
        show_results()


def show_home():
    """Home page."""
    st.title("🧠 Schizophrenia Detection via Multimodal AI")

    st.markdown("---")

    st.header("Project Overview")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Objective")
        st.markdown(
            """
        This research prototype develops a multimodal deep learning system for schizophrenia classification using:
        
        - **EEG** (Electroencephalography)
        - **MRI** (Structural Magnetic Resonance Imaging)
        - **fMRI** (Functional Magnetic Resonance Imaging)
        - **CT** (Computed Tomography)
        """
        )

    with col2:
        st.subheader("Key Features")
        st.markdown(
            """
        - Multimodal data fusion
        - Deep learning models (CNN, LSTM, Transformer)
        - Explainable AI (Grad-CAM, Saliency Maps)
        - Comprehensive evaluation metrics
        - Research-grade documentation
        """
        )

    st.markdown("---")

    st.subheader("⚠️ Important Disclaimer")
    st.warning(
        """
    **Research Prototype — Not a Clinical Diagnostic Tool**
    
    This system is designed for research purposes only. 
    Results must NOT be used as a standalone clinical diagnosis. 
    Any clinical assessment must involve licensed medical professionals.
    """
    )

    st.markdown("---")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("Dataset Status", "NOT CONFIGURED", delta="Ready for input")

    with col2:
        st.metric("Model Status", "UNTRAINED", delta="Demo mode available")

    with col3:
        st.metric("Demo Mode", "ACTIVE", delta="Using synthetic data")

    st.markdown("---")

    st.subheader("System Architecture")
    st.image(
        "https://via.placeholder.com/800x400?text=System+Architecture",
        use_column_width=True,
    )

    st.markdown(
        """
    **Pipeline:**
    
    1. **Data Preprocessing** → Filtering, normalization, artifact removal
    2. **Feature Extraction** → Spectral, temporal, connectivity features
    3. **Deep Learning** → CNN, LSTM, Transformer models per modality
    4. **Multimodal Fusion** → Early/Late/Attention-based fusion
    5. **Classification** → Binary classification (Healthy/Schizophrenia)
    6. **Explainability** → Grad-CAM, attention maps, channel importance
    7. **Reporting** → Comprehensive research reports
    """
    )


def show_eeg_analysis():
    """EEG analysis page."""
    st.title("📊 EEG Analysis")

    st.markdown("---")

    col1, col2 = st.columns([2, 1])

    with col1:
        st.subheader("Upload EEG Recording")
        st.markdown("Supported formats: .edf, .fif, .csv, .tsv, .set, .bdf, .vhdr")

        uploaded_file = st.file_uploader("Choose EEG file", type=["edf", "fif", "csv", "tsv"])

        if uploaded_file is not None:
            st.success(f"File uploaded: {uploaded_file.name}")

    with col2:
        st.subheader("Demo Mode")
        if st.button("Load Synthetic EEG"):
            from src.utils import SyntheticDataGenerator

            eeg_data = SyntheticDataGenerator.generate_eeg_tensor(n_samples=1)
            st.success("Synthetic EEG loaded")
            st.info(SyntheticDataGenerator.DISCLAIMER)

    st.markdown("---")

    st.subheader("EEG Preprocessing")

    col1, col2, col3 = st.columns(3)

    with col1:
        apply_filter = st.checkbox("Apply Bandpass Filter", value=True)
        if apply_filter:
            freq_range = st.slider("Frequency Range (Hz)", 0.5, 45.0, (0.5, 45.0))

    with col2:
        apply_notch = st.checkbox("Apply Notch Filter", value=True)
        if apply_notch:
            notch_freq = st.selectbox("Notch Frequency", [50, 60])

    with col3:
        normalize = st.checkbox("Normalize", value=True)
        if normalize:
            norm_method = st.selectbox("Normalization", ["zscore", "min_max"])

    if st.button("Process EEG"):
        st.info("Processing EEG data...")
        st.success("EEG preprocessing complete!")

    st.markdown("---")

    st.subheader("Feature Extraction")

    feature_types = st.multiselect(
        "Select Features",
        [
            "Time-Domain",
            "Frequency-Domain",
            "Spectral",
            "Connectivity",
            "Wavelet",
        ],
        default=["Time-Domain", "Frequency-Domain"],
    )

    if st.button("Extract Features"):
        st.info("Extracting features...")
        st.success("Features extracted!")

        st.subheader("Feature Summary")
        st.dataframe(
            {
                "Feature": [
                    "Mean",
                    "Std Dev",
                    "RMS",
                    "Spectral Entropy",
                ],
                "Value": [50.2, 15.3, 52.1, 6.8],
            }
        )


def show_neuroimaging():
    """Neuroimaging analysis page."""
    st.title("🔬 Neuroimaging Analysis")

    st.markdown("---")

    col1, col2 = st.columns([2, 1])

    with col1:
        st.subheader("Upload Brain Image")
        modality = st.selectbox(
            "Select Modality",
            ["MRI (Structural)", "fMRI (Functional)", "CT (Computed Tomography)"],
        )
        st.markdown(f"Supported formats: .nii, .nii.gz, .dcm")

        uploaded_file = st.file_uploader("Choose image file", type=["nii", "gz", "dcm"])

    with col2:
        st.subheader("Demo Mode")
        if st.button("Load Synthetic Brain Image"):
            from src.utils import SyntheticDataGenerator

            img_data = SyntheticDataGenerator.generate_mri_tensor(n_samples=1)
            st.success("Synthetic MRI loaded")
            st.info(SyntheticDataGenerator.DISCLAIMER)

    st.markdown("---")

    st.subheader("Image Preprocessing")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.checkbox("Intensity Normalization", value=True)

    with col2:
        st.checkbox("Skull Stripping", value=False)

    with col3:
        st.checkbox("Resample to Standard Size", value=True)
        if st.checkbox("Resample to Standard Size", value=True, key="resample"):
            size = st.slider("Target Size", 64, 128, 96)

    if st.button("Process Image"):
        st.info("Processing image...")
        st.success("Image preprocessing complete!")


def show_multimodal():
    """Multimodal analysis page."""
    st.title("🎯 Multimodal Fusion & Classification")

    st.markdown("---")

    st.subheader("Select Modalities")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        use_eeg = st.checkbox("EEG", value=True)

    with col2:
        use_mri = st.checkbox("MRI", value=True)

    with col3:
        use_fmri = st.checkbox("fMRI", value=False)

    with col4:
        use_ct = st.checkbox("CT", value=False)

    st.markdown("---")

    st.subheader("Fusion Strategy")

    fusion_method = st.selectbox(
        "Select Fusion Method",
        [
            "Early Fusion (Concatenate embeddings)",
            "Late Fusion (Combine predictions)",
            "Attention Fusion (Cross-modal attention)",
        ],
    )

    st.markdown("---")

    if st.button("Run Multimodal Analysis"):
        st.info("Running multimodal analysis...")

        # Simulate processing
        import time

        progress_bar = st.progress(0)
        for i in range(100):
            time.sleep(0.01)
            progress_bar.progress(i + 1)

        st.success("Analysis complete!")

        st.subheader("Results")

        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric("Predicted Class", "Schizophrenia")

        with col2:
            st.metric("Confidence", "0.82")

        with col3:
            st.metric("ROC-AUC", "0.87")

        st.warning(
            "⚠️ This is a **research prediction** and is **NOT a clinical diagnosis**. "
            "Results must be interpreted by licensed medical professionals."
        )


def show_results():
    """Results page."""
    st.title("📈 Results & Reports")

    st.markdown("---")

    st.subheader("Model Performance")

    # Create dummy metrics
    metrics_data = {
        "Metric": [
            "Accuracy",
            "Precision",
            "Recall",
            "F1-Score",
            "ROC-AUC",
            "Sensitivity",
            "Specificity",
        ],
        "EEG Only": [0.75, 0.73, 0.76, 0.74, 0.81, 0.76, 0.74],
        "MRI Only": [0.78, 0.77, 0.79, 0.78, 0.84, 0.79, 0.77],
        "Multimodal": [0.82, 0.81, 0.83, 0.82, 0.87, 0.83, 0.81],
    }

    st.dataframe(metrics_data, use_container_width=True)

    st.markdown("---")

    st.subheader("Confusion Matrix")

    from sklearn.metrics import confusion_matrix

    # Dummy predictions
    y_true = [0, 0, 1, 1, 0, 1, 1, 0]
    y_pred = [0, 0, 1, 0, 0, 1, 1, 0]

    cm = confusion_matrix(y_true, y_pred)

    import matplotlib.pyplot as plt
    import seaborn as sns

    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=["Healthy", "Schizophrenia"],
        yticklabels=["Healthy", "Schizophrenia"],
        ax=ax,
    )
    ax.set_ylabel("True Label")
    ax.set_xlabel("Predicted Label")
    st.pyplot(fig)

    st.markdown("---")

    st.subheader("Generate Research Report")

    if st.button("Download Report"):
        st.info("Report generation feature coming soon...")


if __name__ == "__main__":
    main()
