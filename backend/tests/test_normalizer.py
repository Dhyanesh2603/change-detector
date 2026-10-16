import pytest
from app.diff.normalizer import HTMLNormalizer
from app.models.ignored_region import IgnoredRegion


def test_normalizer_removes_scripts_and_styles():
    html = """
    <html>
        <head>
            <title>Test Page</title>
            <style>body { color: red; }</style>
            <script>console.log("tracking");</script>
        </head>
        <body>
            <h1>Main Title</h1>
            <p>Real Content Here</p>
        </body>
    </html>
    """
    normalizer = HTMLNormalizer(html)
    sanitized, text, title = normalizer.clean_html_and_extract_text()

    assert title == "Test Page"
    assert "console.log" not in text
    assert "color: red" not in text
    assert "Main Title" in text
    assert "Real Content Here" in text


def test_normalizer_removes_cookie_banner_and_ads():
    html = """
    <html>
        <body>
            <div class="cookie-banner-popup">Please accept our cookies!</div>
            <div class="advertisement-wrapper">Sponsored Ad Here</div>
            <div id="content">Important News Update</div>
        </body>
    </html>
    """
    normalizer = HTMLNormalizer(html)
    sanitized, text, _ = normalizer.clean_html_and_extract_text()

    assert "Please accept our cookies" not in text
    assert "Sponsored Ad Here" not in text
    assert "Important News Update" in text


def test_normalizer_applies_custom_ignored_regions():
    html = """
    <html>
        <body>
            <div class="product-price">$99.99</div>
            <div class="stock-ticker">AAPL +1.2%</div>
            <div class="dynamic-sidebar">Random Quote</div>
        </body>
    </html>
    """
    region = IgnoredRegion(
        website_id=1,
        selector_type="css",
        selector_value=".stock-ticker",
        is_active=True
    )
    normalizer = HTMLNormalizer(html, ignored_regions=[region])
    _, text, _ = normalizer.clean_html_and_extract_text()

    assert "AAPL" not in text
    assert "$99.99" in text


def test_normalizer_replaces_dynamic_timestamps():
    html = """
    <div>Posted 5 minutes ago</div>
    <div>Updated 2026-10-15 14:00:00</div>
    <div>12 users online</div>
    """
    normalizer = HTMLNormalizer(html)
    _, text, _ = normalizer.clean_html_and_extract_text()

    assert "[TIMESTAMP]" in text
    assert "[DYNAMIC_COUNTER]" in text
    assert "5 minutes ago" not in text
    assert "12 users online" not in text
