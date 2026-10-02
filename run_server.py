# -*- coding: utf-8 -*-
"""
NeuroFusion AI - Server Launcher
Runs the Flask API service on http://127.0.0.1:5000
"""

import sys
from pathlib import Path

# Add project root to sys.path
project_root = Path(__file__).resolve().parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from app.api import app, load_cached_models

if __name__ == "__main__":
    print("=" * 70)
    print("       NEUROFUSION AI — MULTIMODAL BACKEND SERVICE")
    print("=" * 70)
    print("[*] Pre-loading ML checkpoints...")
    load_cached_models()
    print("[+] Server ready on http://127.0.0.1:5000")
    print("=" * 70)
    app.run(host="127.0.0.1", port=5000, debug=False)
