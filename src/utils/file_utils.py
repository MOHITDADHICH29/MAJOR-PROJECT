"""File utilities."""

import json
import os
from pathlib import Path
from typing import Any, Dict, List


def create_directories(directories: List[str] | str) -> None:
    """
    Create directories if they don't exist.

    Args:
        directories: List of directory paths or single path.
    """
    if isinstance(directories, str):
        directories = [directories]

    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)


def load_json(file_path: str) -> Dict[str, Any]:
    """
    Load JSON file.

    Args:
        file_path: Path to JSON file.

    Returns:
        Dictionary containing JSON data.
    """
    with open(file_path, "r") as f:
        return json.load(f)


def save_json(data: Dict[str, Any], file_path: str) -> None:
    """
    Save dictionary to JSON file.

    Args:
        data: Dictionary to save.
        file_path: Path to save JSON file.
    """
    Path(file_path).parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2)


def get_relative_path(path: str) -> str:
    """
    Get path relative to project root.

    Args:
        path: Absolute or relative path.

    Returns:
        Relative path.
    """
    return os.path.relpath(path, start=os.getcwd())
