# Code Explanation: `browser_runner.py`

## Matching Source File
`backend/app/workers/browser_runner.py`

---

## 1. Purpose
Provides real headless browser execution using Playwright (Chromium) to render JavaScript-heavy dynamic websites, capture serialized DOM HTML, measure network response duration, and record full-page screenshots.

---

## 2. Responsibilities
- Launching and managing Chromium browser instances.
- Configuring isolated, sandboxed `BrowserContext` sessions with desktop viewports (`1280x800`) and custom user agents.
- Navigating to target URLs with `wait_until="networkidle"` and automatic fallback to `wait_until="domcontentloaded"`.
- Extracting serialized DOM HTML, page title, and PNG screenshot.
- Providing fail-safe fallback to an asynchronous `httpx` HTTP client if browser launching fails.

---

## 3. Main Classes
- `BrowserExecutionResult`: Value object holding execution success status, HTTP status code, response time in ms, page title, serialized raw HTML string, screenshot bytes, and error messages.
- `BrowserRunner`: Static asynchronous service containing browser automation workflows.

---

## 4. Main Functions
- `capture_page(url: str, timeout_ms: Optional[int], take_screenshot: bool) -> BrowserExecutionResult`: Main entry point executing the browser lifecycle.
- `_http_fallback(url: str, start_time: float, original_error: str) -> BrowserExecutionResult`: Resilient fallback mechanism when headless browser binaries fail.

---

## 5. Execution Flow
1. `capture_page` records start timestamp.
2. Spawns `async_playwright` manager.
3. Launches Chromium with container flags (`--no-sandbox`, `--disable-dev-shm-usage`, `--disable-gpu`).
4. Creates isolated `BrowserContext` and `Page`.
5. Navigates to `url` with `wait_until="networkidle"`.
6. If networkidle times out (due to long-polling ads), catches exception and navigates with `wait_until="domcontentloaded"`.
7. Waits 1,000ms for client-side hydration.
8. Captures `page.content()`, `page.title()`, and `page.screenshot(full_page=True)`.
9. Closes context and browser cleanly.
10. Calculates elapsed duration and returns `BrowserExecutionResult`.

---

## 6. Dependencies
- `playwright.async_api`: Official Microsoft Playwright asynchronous API.
- `httpx`: Asynchronous HTTP client for fallback.
- `app.core.config.settings`: Configuration parameters (headless mode, timeouts, user-agent).

---

## 7. Interview Explanation
> *"The BrowserRunner encapsulates all complexity surrounding headless browser automation. Rather than treating web pages as static text documents, it renders real DOM trees after JavaScript execution. By utilizing isolated BrowserContexts instead of restarting Chromium for each task, we achieve high throughput while preventing cookie or session contamination between monitored websites."*

---

## 8. Common Modifications
- Adding proxy support (`context = browser.new_context(proxy={"server": "..."})`) for geo-distributed monitoring.
- Injecting custom request headers or authentication cookies for authenticated paywall checks.
