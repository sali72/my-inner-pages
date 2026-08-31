"""
Logging configuration using structlog.
"""
import structlog
import logging
import sys


def compact_exc_info_processor(logger, method_name, event_dict):
    """
    Format exception info into a concise single-line message (type + message)
    rather than rendering a multi-page full stack traceback.
    """
    exc_info = event_dict.pop("exc_info", None)
    if exc_info is True:
        exc_info = sys.exc_info()
    if exc_info:
        if isinstance(exc_info, tuple) and len(exc_info) == 3:
            exc_type, exc_val, _ = exc_info
            if exc_val is not None:
                event_dict["error"] = f"{exc_type.__name__}: {str(exc_val)}"
            elif exc_type is not None:
                event_dict["error"] = exc_type.__name__
        elif isinstance(exc_info, BaseException):
            event_dict["error"] = f"{type(exc_info).__name__}: {str(exc_info)}"
        elif isinstance(exc_info, str):
            event_dict["error"] = exc_info
    event_dict.pop("stack_info", None)
    return event_dict


def configure_logging():
    """Configure structlog for the application."""
    
    # Silence noisy third-party loggers (litellm, httpx, etc.)
    logging.getLogger("LiteLLM").setLevel(logging.WARNING)
    logging.getLogger("litellm").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    try:
        import litellm
        litellm.suppress_debug_info = True
        litellm.set_verbose = False
    except ImportError:
        pass

    # Suppress full traceback dumps in standard library log formatting
    logging.Formatter.formatException = lambda self, ei: ""

    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )

    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            compact_exc_info_processor,
            structlog.processors.UnicodeDecoder(),
            structlog.dev.ConsoleRenderer(colors=True),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )



def get_logger(name: str):
    """Get a logger instance."""
    return structlog.get_logger(name)
