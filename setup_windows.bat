@echo off
REM Windows setup script for Schizophrenia Detection project

echo.
echo ================================================================
echo Schizophrenia Detection - Windows Setup
echo ================================================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.11+
    exit /b 1
)

echo [1] Checking Python version...
python --version

REM Create virtual environment
echo.
echo [2] Creating virtual environment...
if not exist ".venv" (
    python -m venv .venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)

REM Activate virtual environment
echo.
echo [3] Activating virtual environment...
call .venv\Scripts\activate.bat

REM Upgrade pip
echo.
echo [4] Upgrading pip...
python -m pip install --upgrade pip

REM Install requirements
echo.
echo [5] Installing dependencies...
pip install -r requirements.txt

REM Run environment validation
echo.
echo [6] Validating environment...
python scripts/setup_environment.py

REM Create directories
echo.
echo [7] Creating data directories...
python -c "from pathlib import Path; Path('data/raw/eeg').mkdir(parents=True, exist_ok=True); Path('data/raw/mri').mkdir(parents=True, exist_ok=True); Path('data/raw/fmri').mkdir(parents=True, exist_ok=True); Path('data/raw/ct').mkdir(parents=True, exist_ok=True); Path('data/processed').mkdir(parents=True, exist_ok=True); Path('results/figures').mkdir(parents=True, exist_ok=True); Path('results/metrics').mkdir(parents=True, exist_ok=True); Path('models/checkpoints').mkdir(parents=True, exist_ok=True); print('Directories created.')"

echo.
echo ================================================================
echo Setup Complete!
echo ================================================================
echo.
echo Next steps:
echo   1. Activate environment: .venv\Scripts\activate.bat
echo   2. Launch Streamlit:     streamlit run app/streamlit_app.py
echo   3. Run tests:            pytest tests/ -v
echo   4. Train model:          python scripts/train.py --modality eeg
echo.
pause
