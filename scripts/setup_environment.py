"""Environment setup script."""

import subprocess
import sys
import platform
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_python_version():
    """Check Python version."""
    version = sys.version_info
    logger.info(f"Python Version: {version.major}.{version.minor}.{version.micro}")

    if version.major < 3 or (version.major == 3 and version.minor < 11):
        logger.error("Python 3.11+ required")
        return False

    return True


def check_package(package_name, import_name=None):
    """Check if package is installed."""
    if import_name is None:
        import_name = package_name

    try:
        __import__(import_name)
        logger.info(f"✓ {package_name:<20} PASS")
        return True
    except ImportError:
        logger.warning(f"✗ {package_name:<20} FAIL")
        return False


def main():
    """Run environment checks."""
    logger.info("=" * 60)
    logger.info("Environment Validation")
    logger.info("=" * 60)

    # Python version
    logger.info("\n[1] Python Version")
    python_ok = check_python_version()

    # Core packages
    logger.info("\n[2] Core Packages")
    packages_to_check = [
        ("torch", "torch"),
        ("NumPy", "numpy"),
        ("SciPy", "scipy"),
        ("Pandas", "pandas"),
        ("Scikit-learn", "sklearn"),
    ]

    core_ok = all(check_package(pkg, imp) for pkg, imp in packages_to_check)

    # DL packages
    logger.info("\n[3] Deep Learning")
    dl_packages = [
        ("PyTorch", "torch"),
        ("TorchVision", "torchvision"),
        ("MONAI", "monai"),
    ]

    dl_ok = all(check_package(pkg, imp) for pkg, imp in dl_packages)

    # Medical packages
    logger.info("\n[4] Medical Imaging")
    medical_packages = [
        ("MNE-Python", "mne"),
        ("NiBabel", "nibabel"),
        ("Nilearn", "nilearn"),
        ("PyDICOM", "pydicom"),
    ]

    medical_ok = all(check_package(pkg, imp) for pkg, imp in medical_packages)

    # Viz packages
    logger.info("\n[5] Visualization")
    viz_packages = [
        ("Matplotlib", "matplotlib"),
        ("Seaborn", "seaborn"),
        ("Plotly", "plotly"),
    ]

    viz_ok = all(check_package(pkg, imp) for pkg, imp in viz_packages)

    # App packages
    logger.info("\n[6] Web Application")
    app_packages = [
        ("Streamlit", "streamlit"),
    ]

    app_ok = all(check_package(pkg, imp) for pkg, imp in app_packages)

    # CUDA
    logger.info("\n[7] GPU Support")
    if check_package("torch", "torch"):
        import torch

        cuda_available = torch.cuda.is_available()
        if cuda_available:
            logger.info(f"✓ CUDA Available")
            logger.info(f"  Device: {torch.cuda.get_device_name(0)}")
            logger.info(
                f"  Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB"
            )
        else:
            logger.info("✓ CUDA Not Available (CPU mode)")

    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("Summary")
    logger.info("=" * 60)

    all_ok = python_ok and core_ok and dl_ok and medical_ok and viz_ok and app_ok

    if all_ok:
        logger.info("✓ All essential packages installed!")
        logger.info("\nNext steps:")
        logger.info("1. streamlit run app/streamlit_app.py")
    else:
        logger.error("✗ Some packages are missing. Install with:")
        logger.error("   pip install -r requirements.txt")

    logger.info("=" * 60)

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
