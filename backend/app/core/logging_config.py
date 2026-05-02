import logging
import logging.config
import sys
from typing import Any, Dict


def setup_logging(level: str = "INFO") -> None:
    """Configure structured JSON-like logging for production.

    In production you may swap the formatter for python-json-logger
    or structlog. This gives you timestamped, leveled logs immediately.
    """
    log_format = (
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    )

    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": log_format,
                    "datefmt": "%Y-%m-%d %H:%M:%S",
                },
            },
            "handlers": {
                "stdout": {
                    "class": "logging.StreamHandler",
                    "stream": sys.stdout,
                    "formatter": "default",
                },
                "stderr": {
                    "class": "logging.StreamHandler",
                    "stream": sys.stderr,
                    "formatter": "default",
                    "level": "WARNING",
                },
            },
            "loggers": {
                "": {"handlers": ["stdout", "stderr"], "level": level},
                "uvicorn": {"handlers": ["stdout"], "level": level, "propagate": False},
                "sqlalchemy.engine": {"handlers": ["stdout"], "level": "WARNING", "propagate": False},
            },
        }
    )


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
