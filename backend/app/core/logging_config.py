"""
Structured logging configuration for the application.

Emits single-line JSON records so logs can be ingested directly by
log aggregators (CloudWatch, Datadog, ELK) without parsing rules.
"""

import json
import logging
import sys
from datetime import UTC, datetime

logger = logging.getLogger("app")


class JsonFormatter(logging.Formatter):
    """Format log records as one-line JSON objects."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        # Extra context passed via `extra={...}` lands in `record.__dict__`
        reserved = set(vars(logging.makeLogRecord({}))) | {"message", "asctime"}
        for key, value in record.__dict__.items():
            if key not in reserved and not key.startswith("_"):
                payload[key] = value
        return json.dumps(payload, default=str)


def configure_logging(log_level: str = "INFO") -> None:
    """Configure the root logger with structured JSON output."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(log_level.upper())
