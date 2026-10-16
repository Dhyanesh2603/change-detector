import re
from typing import List, Optional
from bs4 import BeautifulSoup, Comment
from app.models.ignored_region import IgnoredRegion
from app.core.logging import logger

# Common noise tags to remove unconditionally
UNWANTED_TAGS = [
    "script",
    "style",
    "noscript",
    "iframe",
    "svg",
    "canvas",
    "embed",
    "object",
    "applet",
]

# Common ad, cookie banner, and tracking class/id substring heuristics
NOISE_CONTAINER_PATTERNS = [
    r"cookie[-_]?(banner|consent|modal|notice|popup)",
    r"gdpr[-_]?(banner|consent|modal|notice)",
    r"ad[-_]?(container|wrapper|banner|slot|unit|frame)",
    r"adsbygoogle",
    r"advertisement",
    r"tracking[-_]?(pixel|tag|container)",
    r"live[-_]?(chat|counter|views|visitors)",
]

# Regex patterns for dynamic text noise (timestamps, relative times, tokens)
TIMESTAMP_REGEX = re.compile(
    r"\b\d{4}[-/]\d{2}[-/]\d{2}(?:T|\s+)\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b|"
    r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b|"
    r"\b\d{1,2}\s+(?:seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s+ago\b|"
    r"\b(?:just now|moments ago|today|yesterday)\b|"
    r"\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b",
    re.IGNORECASE
)

SESSION_OR_NONCE_REGEX = re.compile(r"\b[a-f0-9]{32,64}\b", re.IGNORECASE)
DYNAMIC_COUNTER_REGEX = re.compile(r"\b(?:\d+[\d,]*)\s*(?:views|online|visitors|users|watching|items in cart)\b", re.IGNORECASE)


class HTMLNormalizer:
    """
    Cleans raw HTML by stripping scripts, advertisements, tracking tags,
    dynamic timestamps, session nonces, and user-specified CSS ignored regions.
    Produces clean, deterministic semantic content for change detection.
    """

    def __init__(self, raw_html: str, ignored_regions: Optional[List[IgnoredRegion]] = None):
        self.raw_html = raw_html or ""
        self.ignored_regions = ignored_regions or []

    def clean_html_and_extract_text(self) -> tuple[str, str, Optional[str]]:
        """
        Executes the full normalization pipeline.
        Returns:
            (sanitized_html: str, normalized_text: str, page_title: Optional[str])
        """
        if not self.raw_html.strip():
            return "", "", None

        # Parse with html.parser or lxml
        soup = BeautifulSoup(self.raw_html, "html.parser")

        # Extract title before manipulation
        page_title = soup.title.string.strip() if soup.title and soup.title.string else None

        # 1. Remove comments
        for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
            comment.extract()

        # 2. Remove standard unwanted tags (scripts, stylesheets, etc.)
        for tag_name in UNWANTED_TAGS:
            for element in soup.find_all(tag_name):
                element.decompose()

        # 3. Remove user-configured ignored regions
        for region in self.ignored_regions:
            if not region.is_active:
                continue
            try:
                if region.selector_type == "css":
                    for matched in soup.select(region.selector_value):
                        matched.decompose()
                elif region.selector_type == "tag":
                    for matched in soup.find_all(region.selector_value):
                        matched.decompose()
            except Exception as e:
                logger.warning(f"Error applying ignored selector '{region.selector_value}': {e}")

        # 4. Remove automatic dynamic noise containers (cookie banners, ads, live counters)
        for pattern in NOISE_CONTAINER_PATTERNS:
            regex = re.compile(pattern, re.IGNORECASE)
            for elem in soup.find_all(attrs={"class": regex}):
                elem.decompose()
            for elem in soup.find_all(attrs={"id": regex}):
                elem.decompose()

        # 5. Remove dynamic attributes (csrf tokens, nonces, data-reactroot, etc.)
        for elem in soup.find_all(True):
            elem.attrs = {
                k: v for k, v in elem.attrs.items()
                if not any(noise in k.lower() for noise in ["csrf", "token", "nonce", "session", "fingerprint"])
            }

        # 6. Extract textual content
        raw_text = soup.get_text(separator="\n")

        # 7. Apply dynamic text filters to text
        normalized_text = self._normalize_dynamic_text(raw_text)

        sanitized_html = str(soup)
        return sanitized_html, normalized_text, page_title

    def _normalize_dynamic_text(self, text: str) -> str:
        """
        Replaces volatile dynamic content (timestamps, counters, session hashes)
        with static placeholders so hashes don't trigger false positives.
        """
        # Replace timestamps
        text = TIMESTAMP_REGEX.sub("[TIMESTAMP]", text)

        # Replace session tokens / hashes
        text = SESSION_OR_NONCE_REGEX.sub("[HASH_TOKEN]", text)

        # Replace live counters
        text = DYNAMIC_COUNTER_REGEX.sub("[DYNAMIC_COUNTER]", text)

        # Normalize whitespace line by line
        clean_lines: List[str] = []
        for line in text.splitlines():
            line = " ".join(line.split()).strip()
            if line:
                clean_lines.append(line)

        return "\n".join(clean_lines)
