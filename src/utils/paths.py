"""Project path helpers."""

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def resolve_data_path(path: str) -> Path:
    """Resolve dataset file paths relative to the project root."""
    if not path:
        raise ValueError("Empty data path")

    p = Path(path)
    if p.is_absolute() and p.exists():
        return p

    candidate = PROJECT_ROOT / path
    if candidate.exists():
        return candidate

    if p.exists():
        return p.resolve()

    raise FileNotFoundError(f"Data file not found: {path} (resolved from {PROJECT_ROOT})")
