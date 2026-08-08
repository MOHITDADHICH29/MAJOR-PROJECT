"""Configuration loader."""

import yaml
import os
from typing import Any, Dict
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class ConfigLoader:
    """Load and manage YAML configuration files."""

    def __init__(self, config_dir: str = "config"):
        """
        Initialize config loader.

        Args:
            config_dir: Directory containing config files.
        """
        self.config_dir = Path(config_dir)
        self.configs = {}

    def load_config(self, config_name: str) -> Dict[str, Any]:
        """
        Load a single configuration file.

        Args:
            config_name: Name of config file (without .yaml extension).

        Returns:
            Dictionary containing configuration.
        """
        config_path = self.config_dir / f"{config_name}.yaml"

        if not config_path.exists():
            raise FileNotFoundError(f"Config file not found: {config_path}")

        with open(config_path, "r") as f:
            config = yaml.safe_load(f)

        logger.info(f"Loaded config from {config_path}")
        self.configs[config_name] = config

        return config

    def load_all_configs(self) -> Dict[str, Dict[str, Any]]:
        """
        Load all configuration files from config directory.

        Returns:
            Dictionary of all configurations.
        """
        if not self.config_dir.exists():
            raise FileNotFoundError(f"Config directory not found: {self.config_dir}")

        for config_file in self.config_dir.glob("*.yaml"):
            config_name = config_file.stem
            self.load_config(config_name)

        logger.info(f"Loaded {len(self.configs)} configuration files")
        return self.configs

    def get_config(self, config_name: str) -> Dict[str, Any]:
        """
        Get configuration (load if not already loaded).

        Args:
            config_name: Name of config file.

        Returns:
            Dictionary containing configuration.
        """
        if config_name not in self.configs:
            self.load_config(config_name)

        return self.configs[config_name]

    def get_nested(self, config_name: str, key_path: str, default: Any = None) -> Any:
        """
        Get nested value from configuration.

        Args:
            config_name: Name of config file.
            key_path: Path to key (e.g., "training.batch_size").
            default: Default value if key not found.

        Returns:
            Value from configuration.

        Example:
            >>> loader = ConfigLoader()
            >>> batch_size = loader.get_nested("config", "training.batch_size")
        """
        config = self.get_config(config_name)
        keys = key_path.split(".")

        value = config
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default

        return value
