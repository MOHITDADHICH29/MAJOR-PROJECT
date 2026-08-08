#!/bin/bash
# Linux/Mac setup script for Schizophrenia Detection project

echo ""
echo "================================================================"
echo "Schizophrenia Detection - Unix Setup"
echo "================================================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 not found. Please install Python 3.11+"
    exit 1
fi

echo "[1] Checking Python version..."
python3 --version

# Create virtual environment
echo ""
echo "[2] Creating virtual environment..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "Virtual environment created."
else
    echo "Virtual environment already exists."
fi

# Activate virtual environment
echo ""
echo "[3] Activating virtual environment..."
source .venv/bin/activate

# Upgrade pip
echo ""
echo "[4] Upgrading pip..."
python -m pip install --upgrade pip

# Install requirements
echo ""
echo "[5] Installing dependencies..."
pip install -r requirements.txt

# Run environment validation
echo ""
echo "[6] Validating environment..."
python scripts/setup_environment.py

# Create directories
echo ""
echo "[7] Creating data directories..."
python -c "from pathlib import Path; Path('data/raw/eeg').mkdir(parents=True, exist_ok=True); Path('data/raw/mri').mkdir(parents=True, exist_ok=True); Path('data/raw/fmri').mkdir(parents=True, exist_ok=True); Path('data/raw/ct').mkdir(parents=True, exist_ok=True); Path('data/processed').mkdir(parents=True, exist_ok=True); Path('results/figures').mkdir(parents=True, exist_ok=True); Path('results/metrics').mkdir(parents=True, exist_ok=True); Path('models/checkpoints').mkdir(parents=True, exist_ok=True); print('Directories created.')"

echo ""
echo "================================================================"
echo "Setup Complete!"
echo "================================================================"
echo ""
echo "Next steps:"
echo "  1. Activate environment: source .venv/bin/activate"
echo "  2. Launch Streamlit:     streamlit run app/streamlit_app.py"
echo "  3. Run tests:            pytest tests/ -v"
echo "  4. Train model:          python scripts/train.py --modality eeg"
echo ""
