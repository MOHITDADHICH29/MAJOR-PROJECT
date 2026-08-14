#!/usr/bin/env python3
"""Deprecated wrapper — use scripts/train.py instead."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

if __name__ == "__main__":
    from scripts.train import main

    print("Note: train_real_data.py now delegates to scripts/train.py (real data only).")
    main()
