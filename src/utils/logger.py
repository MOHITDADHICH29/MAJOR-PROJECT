"""Logging utilities."""

import logging
import os
from pathlib import Path
from typing import Optional


def setup_logging(
    log_dir: str = "results/logs",
    log_level: str = "INFO",
    log_file: Optional[str] = None,
) -> None:
    """
    Set up logging configuration.

    Args:
        log_dir: Directory to save log files.
        log_level: Logging level ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL').
        log_file: Name of log file. If None, no file logging.
    """
    # Create log directory
    Path(log_dir).mkdir(parents=True, exist_ok=True)

    # Set up formatter
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    formatter = logging.Formatter(log_format)

    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level))

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(getattr(logging, log_level))
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # File handler
    if log_file:
        log_path = os.path.join(log_dir, log_file)
        file_handler = logging.FileHandler(log_path)
        file_handler.setLevel(getattr(logging, log_level))
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance.

    Args:
        name: Logger name (usually __name__).

    Returns:
        logging.Logger: Logger instance.
    """
    return logging.getLogger(name)
