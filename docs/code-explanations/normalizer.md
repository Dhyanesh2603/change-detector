# Code Explanation: `normalizer.py`

## Matching Source File
`backend/app/diff/normalizer.py`

---

## 1. Purpose
Sanitizes raw HTML by removing non-content tags, ads, cookie banners, tracking scripts, and user-specified CSS ignored regions, while converting volatile dynamic text (timestamps, session tokens, live counters) into static placeholders.

---

## 2. Responsibilities
- Parsing raw HTML using BeautifulSoup.
- Stripping non-visual tags (`<script>`, `<style>`, `<iframe>`, `<svg>`).
- Decomposing common ad containers and cookie consent banners using heuristic regex patterns.
- Querying and deleting user-configured `IgnoredRegion` CSS selectors.
- Masking ISO timestamps, relative times, hex nonces, and live visitor counters in text.
- Collapsing redundant whitespace into clean, deterministic multi-line text.

---

## 3. Main Classes
- `HTMLNormalizer`: Pipeline orchestrator accepting `raw_html` and a list of `IgnoredRegion` models.

---

## 4. Main Functions
- `clean_html_and_extract_text() -> tuple[str, str, Optional[str]]`: Executes the 7-step normalization pipeline; returns `(sanitized_html, normalized_text, page_title)`.
- `_normalize_dynamic_text(text: str) -> str`: Applies regex masks for timestamps, session hashes, and counters, followed by line trimming.

---

## 5. Execution Flow
1. Instantiates `BeautifulSoup` object.
2. Extracts `<title>` tag content.
3. Removes HTML comments.
4. Decomposes tags in `UNWANTED_TAGS` (`script`, `style`, `noscript`, `iframe`, etc.).
5. Iterates over active `ignored_regions` and runs `soup.select(selector_value)` to delete matching DOM subtrees.
6. Scans class and ID attributes against `NOISE_CONTAINER_PATTERNS` to drop cookie modals and ads.
7. Strips dynamic attributes (`csrf`, `token`, `nonce`, `session`).
8. Extracts text via `soup.get_text(separator="\n")`.
9. Passes text through regex patterns replacing volatile substrings with `[TIMESTAMP]`, `[HASH_TOKEN]`, and `[DYNAMIC_COUNTER]`.
10. Collapses whitespace and returns normalized outputs.

---

## 6. Dependencies
- `bs4.BeautifulSoup`: DOM parsing and manipulation.
- `re`: Regular expressions for pattern matching.
- `app.models.ignored_region.IgnoredRegion`: Domain model for custom selectors.

---

## 7. Interview Explanation
> *"HTMLNormalizer solves the primary challenge of automated website monitoring: separating content signal from dynamic noise. By combining structural DOM decomposition with semantic regex token replacement, we eliminate false positives caused by updating timestamps or rotating ads, ensuring that SHA-256 hashes represent genuine editorial changes."*

---

## 8. Common Modifications
- Expanding `NOISE_CONTAINER_PATTERNS` with domain-specific ad network selectors.
- Adding XPath selector evaluation support via `lxml.etree`.
