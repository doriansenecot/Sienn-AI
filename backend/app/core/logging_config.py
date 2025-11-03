"""Logging configuration for Sienn-AI."""
import logging
import sys
from datetime import datetime
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from pathlib import Path
from typing import Optional

from pythonjsonlogger import jsonlogger


class ContextualJsonFormatter(jsonlogger.JsonFormatter):
    """JSON formatter with additional context fields."""
    
    def add_fields(self, log_record, record, message_dict):
        """Add custom fields to log record."""
        super().add_fields(log_record, record, message_dict)
        
        # Add timestamp in ISO format
        if not log_record.get('timestamp'):
            log_record['timestamp'] = datetime.utcnow().isoformat()
        
        # Add component identifier
        if not log_record.get('component'):
            if 'app.routes' in record.name:
                log_record['component'] = 'api'
            elif 'app.services' in record.name:
                log_record['component'] = 'service'
            elif 'app.tasks' in record.name:
                log_record['component'] = 'worker'
            else:
                log_record['component'] = 'app'
        
        # Add log level as string
        log_record['level'] = record.levelname
        
        # Add module and function info
        log_record['module'] = record.module
        log_record['function'] = record.funcName
        log_record['line'] = record.lineno


def setup_logging(
    level: str = "INFO",
    log_dir: Optional[Path] = None,
    enable_json: bool = True,
    enable_file_rotation: bool = True
) -> None:
    """
    Configure structured logging for the application with file rotation.
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory for log files (creates subdirectories per component)
        enable_json: If True, use JSON formatted logs
        enable_file_rotation: If True, enable log rotation (by size and time)
    """
    log_level = getattr(logging, level.upper(), logging.INFO)
    
    # Create root logger
    logger = logging.getLogger()
    logger.setLevel(log_level)
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # Setup formatters
    if enable_json:
        json_formatter = ContextualJsonFormatter(
            fmt="%(timestamp)s %(level)s %(name)s %(message)s"
        )
        console_formatter = json_formatter
    else:
        console_formatter = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
    
    # Console handler (always enabled)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    # File handlers (if log_dir specified)
    if log_dir:
        log_dir = Path(log_dir)
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # Main application log (all messages)
        main_log_file = log_dir / "sienn-ai.log"
        if enable_file_rotation:
            # Rotate by size (10MB) and keep 10 backups
            main_handler = RotatingFileHandler(
                main_log_file,
                maxBytes=10 * 1024 * 1024,  # 10MB
                backupCount=10
            )
        else:
            main_handler = logging.FileHandler(main_log_file)
        
        main_handler.setLevel(log_level)
        main_handler.setFormatter(json_formatter if enable_json else console_formatter)
        logger.addHandler(main_handler)
        
        # Error log (ERROR and CRITICAL only)
        error_log_file = log_dir / "errors.log"
        if enable_file_rotation:
            error_handler = RotatingFileHandler(
                error_log_file,
                maxBytes=5 * 1024 * 1024,  # 5MB
                backupCount=5
            )
        else:
            error_handler = logging.FileHandler(error_log_file)
        
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(json_formatter if enable_json else console_formatter)
        logger.addHandler(error_handler)
        
        # Daily rotating log for audit trail
        daily_log_file = log_dir / "daily" / f"sienn-ai-{datetime.now().strftime('%Y%m%d')}.log"
        daily_log_file.parent.mkdir(exist_ok=True)
        
        daily_handler = TimedRotatingFileHandler(
            daily_log_file,
            when='midnight',
            interval=1,
            backupCount=30  # Keep 30 days
        )
        daily_handler.setLevel(logging.INFO)
        daily_handler.setFormatter(json_formatter if enable_json else console_formatter)
        logger.addHandler(daily_handler)
    
    # Configure third-party loggers
    _configure_third_party_loggers()


def _configure_third_party_loggers() -> None:
    """Configure logging levels for third-party libraries."""
    # Reduce verbosity of third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("celery").setLevel(logging.INFO)
    logging.getLogger("transformers").setLevel(logging.WARNING)
    logging.getLogger("torch").setLevel(logging.WARNING)
    logging.getLogger("datasets").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("minio").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance.
    
    Args:
        name: Logger name (usually __name__)
    
    Returns:
        Logger instance
    """
    return logging.getLogger(name)


class LogContext:
    """Context manager for adding extra context to logs."""
    
    def __init__(self, logger: logging.Logger, **context):
        """
        Initialize log context.
        
        Args:
            logger: Logger instance
            **context: Additional context fields (job_id, user_id, etc.)
        """
        self.logger = logger
        self.context = context
        self.old_factory = None
    
    def __enter__(self):
        """Enter context - add extra fields to all log records."""
        self.old_factory = logging.getLogRecordFactory()
        
        def record_factory(*args, **kwargs):
            record = self.old_factory(*args, **kwargs)
            for key, value in self.context.items():
                setattr(record, key, value)
            return record
        
        logging.setLogRecordFactory(record_factory)
        return self.logger
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context - restore original factory."""
        logging.setLogRecordFactory(self.old_factory)


def log_function_call(logger: logging.Logger):
    """
    Decorator to automatically log function calls with parameters.
    
    Args:
        logger: Logger instance to use
    
    Example:
        @log_function_call(logger)
        def my_function(arg1, arg2):
            pass
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            logger.debug(
                f"Calling {func.__name__}",
                extra={
                    "function": func.__name__,
                    "args": str(args)[:100],  # Limit to 100 chars
                    "kwargs": str(kwargs)[:100]
                }
            )
            try:
                result = func(*args, **kwargs)
                logger.debug(
                    f"Function {func.__name__} completed successfully",
                    extra={"function": func.__name__}
                )
                return result
            except Exception as e:
                logger.error(
                    f"Function {func.__name__} failed: {str(e)}",
                    extra={"function": func.__name__, "error": str(e)},
                    exc_info=True
                )
                raise
        return wrapper
    return decorator


def log_performance(logger: logging.Logger, operation: str):
    """
    Context manager to log operation performance.
    
    Args:
        logger: Logger instance
        operation: Operation name
    
    Example:
        with log_performance(logger, "model_loading"):
            load_model()
    """
    import time
    
    class PerformanceLogger:
        def __enter__(self):
            self.start_time = time.time()
            logger.info(f"Starting {operation}", extra={"operation": operation})
            return self
        
        def __exit__(self, exc_type, exc_val, exc_tb):
            duration = time.time() - self.start_time
            if exc_type is None:
                logger.info(
                    f"Completed {operation}",
                    extra={
                        "operation": operation,
                        "duration_seconds": round(duration, 3),
                        "status": "success"
                    }
                )
            else:
                logger.error(
                    f"Failed {operation}",
                    extra={
                        "operation": operation,
                        "duration_seconds": round(duration, 3),
                        "status": "failed",
                        "error": str(exc_val)
                    }
                )
    
    return PerformanceLogger()
