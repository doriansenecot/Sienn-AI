# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive test suite with Vitest for frontend components (Button, Card, Input)
- Test coverage for utility functions (formatters)
- API client tests with axios-mock-adapter
- Prometheus metrics endpoint (`/api/metrics/prometheus`) for monitoring
- Rate limiting middleware using Redis
- File validation utilities with MIME type checking and sanitization
- Comprehensive health check system for all services
- Automated cleanup task for old jobs (Celery Beat scheduled)
- GGUF model export functionality with llama.cpp integration
- Retry mechanism for Celery tasks with exponential backoff
- Service health endpoint (`/api/health/services`)
- Production build script (`scripts/build_production.sh`)
- Release automation script (`scripts/release.sh`)
- Automated demo script (`scripts/demo_automated.sh`)
- Health check script (`backend/scripts/health_check.py`)
- Cache optimization script (`backend/scripts/optimize_cache.py`)
- Makefile with common development commands
- Celery Beat service in docker-compose for scheduled tasks
- Extended configuration options (rate limiting, logging, paths)

### Changed
- Fixed CSS conflict in components.css (bg-right vs bg-center)
- Improved cleanup_old_jobs task with full implementation
- Enhanced metrics endpoint with Prometheus format support
- Updated package.json with test scripts and dependencies
- Enhanced .env.example with all configuration options

### Security
- Added file validation for uploads (extension, MIME type, size checks)
- Implemented filename sanitization to prevent path traversal attacks
- Added rate limiting support (configurable, Redis-based)
- Enhanced health checks for service monitoring

### Documentation
- Created CONTRIBUTING.md with development guidelines
- Updated TODO.md with completion status
- Documented all new endpoints in API documentation

### Developer Experience
- Added Makefile for simplified commands (make dev, make test, etc.)
- Created comprehensive scripts for common tasks
- Improved logging throughout the application
- Added health check utilities

## [0.1.0] - TBD

### Added
- Initial MVP release
- Backend API with FastAPI
- Frontend with React + TypeScript
- LoRA/PEFT fine-tuning
- Celery worker for async training
- MinIO for model storage
- SQLite database
- Docker Compose setup
- Model inference and testing
- Model export (PyTorch, Ollama, GGUF)

[Unreleased]: https://github.com/doriansenecot/Sienn-AI/compare/v0.1.0...HEAD
