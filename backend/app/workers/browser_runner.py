import time
from typing import Optional, Dict, Any
from playwright.async_api import async_playwright, Browser, BrowserContext, Page, Error as PlaywrightError
from app.core.config import settings
from app.core.logging import logger
import httpx


class BrowserExecutionResult:
    """
    Value object containing the result of a browser page render.
    """
    def __init__(
        self,
        success: bool,
        url: str,
        http_status: int = 0,
        response_time_ms: int = 0,
        page_title: Optional[str] = None,
        raw_html: str = "",
        screenshot_bytes: Optional[bytes] = None,
        error_message: Optional[str] = None
    ):
        self.success = success
        self.url = url
        self.http_status = http_status
        self.response_time_ms = response_time_ms
        self.page_title = page_title
        self.raw_html = raw_html
        self.screenshot_bytes = screenshot_bytes
        self.error_message = error_message


class BrowserRunner:
    """
    Manages Playwright browser automation with real Chromium rendering,
    network idle synchronization, DOM serialization, and full-page screenshot capture.
    Provides fallback to HTTP client if browser crashes.
    """

    @staticmethod
    async def capture_page(
        url: str,
        timeout_ms: Optional[int] = None,
        take_screenshot: bool = True
    ) -> BrowserExecutionResult:
        """
        Launches headless browser, navigates to target URL, waits for network idle,
        extracts raw HTML, page title, screenshot, and measures response time.
        """
        timeout = timeout_ms or settings.PLAYWRIGHT_TIMEOUT_MS
        start_time = time.perf_counter()

        try:
            async with async_playwright() as p:
                browser: Browser = await p.chromium.launch(
                    headless=settings.PLAYWRIGHT_HEADLESS,
                    args=[
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-gpu",
                        "--disable-extensions",
                    ]
                )

                context: BrowserContext = await browser.new_context(
                    user_agent=settings.PLAYWRIGHT_USER_AGENT,
                    viewport={"width": 1280, "height": 800},
                    ignore_https_errors=True,
                )

                page: Page = await context.new_page()

                # Navigate with graceful fallback from networkidle to domcontentloaded
                http_status = 200
                response = None
                try:
                    response = await page.goto(url, wait_until="networkidle", timeout=timeout)
                except Exception:
                    # Fallback if networkidle timed out due to streaming/long-polling ads
                    logger.warning(f"Networkidle timed out for {url}; retrying with domcontentloaded")
                    try:
                        response = await page.goto(url, wait_until="domcontentloaded", timeout=timeout)
                    except Exception as nav_err:
                        raise nav_err

                if response:
                    http_status = response.status

                # Brief wait for client-side hydration (e.g. React/Vue/Angular)
                await page.wait_for_timeout(1000)

                raw_html = await page.content()
                page_title = await page.title()

                screenshot_bytes: Optional[bytes] = None
                if take_screenshot:
                    try:
                        screenshot_bytes = await page.screenshot(
                            full_page=True,
                            type="png",
                            timeout=10000
                        )
                    except Exception as ss_err:
                        logger.warning(f"Full-page screenshot failed: {ss_err}; attempting viewport capture")
                        screenshot_bytes = await page.screenshot(full_page=False, type="png")

                await context.close()
                await browser.close()

                duration_ms = int((time.perf_counter() - start_time) * 1000)

                return BrowserExecutionResult(
                    success=True,
                    url=url,
                    http_status=http_status,
                    response_time_ms=duration_ms,
                    page_title=page_title,
                    raw_html=raw_html,
                    screenshot_bytes=screenshot_bytes
                )

        except Exception as e:
            logger.error(f"Playwright rendering failed for {url}: {e}. Attempting HTTP fallback.")
            return await BrowserRunner._http_fallback(url, start_time, str(e))

    @staticmethod
    async def _http_fallback(url: str, start_time: float, original_error: str) -> BrowserExecutionResult:
        """
        Fast fallback using httpx when headless browser fails to start
        or encounters environment-specific sandbox issues.
        """
        try:
            headers = {"User-Agent": settings.PLAYWRIGHT_USER_AGENT}
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, verify=False) as client:
                res = await client.get(url, headers=headers)
                duration_ms = int((time.perf_counter() - start_time) * 1000)

                return BrowserExecutionResult(
                    success=True,
                    url=url,
                    http_status=res.status_code,
                    response_time_ms=duration_ms,
                    page_title=url,
                    raw_html=res.text,
                    screenshot_bytes=None,
                    error_message=f"Rendered via HTTP Fallback (Browser error: {original_error})"
                )
        except Exception as fallback_err:
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            return BrowserExecutionResult(
                success=False,
                url=url,
                http_status=0,
                response_time_ms=duration_ms,
                error_message=f"Browser error: {original_error}; HTTP Fallback error: {fallback_err}"
            )
