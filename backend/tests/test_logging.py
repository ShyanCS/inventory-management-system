"""
Tests for structured JSON logging configuration.
"""

import json
import logging

from app.core.logging_config import JsonFormatter, configure_logging, logger


def _make_record(
    msg: str, level: int = logging.INFO, extra: dict | None = None
) -> logging.LogRecord:
    record = logging.LogRecord(
        name="app.test",
        level=level,
        pathname="test.py",
        lineno=1,
        msg=msg,
        args=("world",) if "%s" in msg else (),
        exc_info=None,
    )
    if extra:
        record.__dict__.update(extra)
    return record


def test_json_formatter_emits_parseable_json():
    formatter = JsonFormatter()
    output = formatter.format(_make_record("hello %s", extra={"path": "/health"}))
    parsed = json.loads(output)

    assert parsed["message"] == "hello world"
    assert parsed["level"] == "INFO"
    assert parsed["logger"] == "app.test"
    assert "timestamp" in parsed


def test_json_formatter_includes_extra_context():
    formatter = JsonFormatter()
    output = formatter.format(
        _make_record("Request completed", extra={"http_method": "GET", "status_code": 200})
    )
    parsed = json.loads(output)

    assert parsed["http_method"] == "GET"
    assert parsed["status_code"] == 200


def test_configure_logging_sets_level_and_handler():
    configure_logging("debug")

    root = logging.getLogger()
    assert root.level == logging.DEBUG
    assert len(root.handlers) == 1
    assert isinstance(root.handlers[0].formatter, JsonFormatter)


def test_logger_emits_valid_json_to_handler(capfd):
    configure_logging("INFO")
    logger.info("log smoke test", extra={"event": "smoke"})

    captured = capfd.readouterr().out.strip().splitlines()
    parsed = json.loads(captured[-1])
    assert parsed["message"] == "log smoke test"
    assert parsed["event"] == "smoke"


def test_request_middleware_logs_completion(client):
    response = client.get("/health")
    assert response.status_code == 200
