import logging
import sys

def setup_logging():
    """
    Configures structured, readable console logging for the application.
    Adheres to the developer-first, clear observability philosophy.
    """
    logger = logging.getLogger("change_detector")
    logger.setLevel(logging.INFO)

    # Avoid duplicate handlers if setup_logging is called multiple times
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(name)s (%(module)s:%(lineno)d): %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    # Configure root logger as well
    logging.basicConfig(level=logging.INFO)
    return logger

logger = setup_logging()
