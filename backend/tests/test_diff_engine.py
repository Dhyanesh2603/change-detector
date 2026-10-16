import pytest
from app.diff.diff_engine import DiffEngine


def test_diff_engine_identical_content():
    text_a = "Line 1\nLine 2\nLine 3"
    text_b = "Line 1\nLine 2\nLine 3"

    res = DiffEngine.compare(text_a, text_b)
    assert res["has_changes"] is False
    assert res["lines_added"] == 0
    assert res["lines_removed"] == 0
    assert res["lines_modified"] == 0
    assert res["change_percentage"] == 0.0
    assert "No meaningful content changes" in res["summary"]


def test_diff_engine_line_added():
    text_a = "Pricing\nBasic: $10\nPro: $20"
    text_b = "Pricing\nBasic: $10\nPro: $20\nEnterprise: $50"

    res = DiffEngine.compare(text_a, text_b)
    assert res["has_changes"] is True
    assert res["lines_added"] == 1
    assert res["lines_removed"] == 0
    assert res["change_percentage"] > 0
    assert "+1 lines added" in res["summary"]


def test_diff_engine_line_modified():
    text_a = "Header\nStatus: Maintenance\nFooter"
    text_b = "Header\nStatus: Operational\nFooter"

    res = DiffEngine.compare(text_a, text_b)
    assert res["has_changes"] is True
    assert res["lines_modified"] == 1
    assert "modified" in res["summary"]
    assert len(res["chunks"]) > 0


def test_diff_engine_empty_input():
    res = DiffEngine.compare("", "")
    assert res["has_changes"] is False
    assert res["change_percentage"] == 0.0
