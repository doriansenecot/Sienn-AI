.PHONY: help install dev build test lint format clean up down logs health demo release

# Default target
.DEFAULT_GOAL := help

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Sienn-AI - AI Fine-tuning Platform$(NC)"
	@echo ""
	@echo "$(GREEN)Available targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

install: ## Install all dependencies (backend + frontend)
	@echo "$(BLUE)Installing dependencies...$(NC)"
	cd backend && pip install -r requirements.txt
	cd frontend && npm install
	@echo "$(GREEN)✅ Dependencies installed$(NC)"

dev: ## Start development environment
	@echo "$(BLUE)Starting development environment...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Services started$(NC)"
	@echo "Frontend: http://localhost:3000"
	@echo "API: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

build: ## Build production images
	@echo "$(BLUE)Building production images...$(NC)"
	./scripts/build_production.sh

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## View logs (all services)
	docker-compose logs -f

logs-api: ## View API logs
	docker-compose logs -f api

logs-worker: ## View worker logs
	docker-compose logs -f worker

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

health: ## Check system health
	@python3 backend/scripts/health_check.py

test: ## Run all tests
	@echo "$(BLUE)Running backend tests...$(NC)"
	cd backend && pytest tests/unit/ -v --cov=app
	@echo "$(BLUE)Running frontend tests...$(NC)"
	cd frontend && npm run test

test-backend: ## Run backend tests only
	cd backend && pytest tests/unit/ -v --cov=app

test-frontend: ## Run frontend tests only
	cd frontend && npm run test

lint: ## Lint all code
	@echo "$(BLUE)Linting backend...$(NC)"
	cd backend && ruff check app/
	cd backend && black --check app/
	@echo "$(BLUE)Linting frontend...$(NC)"
	cd frontend && npm run lint

lint-fix: ## Fix linting issues
	@echo "$(BLUE)Fixing backend linting...$(NC)"
	cd backend && ruff check app/ --fix
	cd backend && black app/
	@echo "$(BLUE)Fixing frontend linting...$(NC)"
	cd frontend && npm run lint:fix
	cd frontend && npm run format

format: lint-fix ## Alias for lint-fix

clean: ## Clean build artifacts and caches
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	rm -rf frontend/dist frontend/node_modules/.vite
	rm -rf backend/.coverage backend/htmlcov
	@echo "$(GREEN)✅ Cleaned$(NC)"

clean-all: clean ## Clean everything including Docker volumes
	@echo "$(YELLOW)Cleaning Docker volumes...$(NC)"
	docker-compose down -v
	@echo "$(GREEN)✅ All cleaned$(NC)"

demo: ## Run automated demo
	@echo "$(BLUE)Starting automated demo...$(NC)"
	./scripts/demo_automated.sh

release: ## Create a new release (usage: make release VERSION=0.1.0)
	@if [ -z "$(VERSION)" ]; then \
		echo "$(RED)Error: VERSION not specified. Usage: make release VERSION=0.1.0$(NC)"; \
		exit 1; \
	fi
	./scripts/release.sh $(VERSION)

shell-api: ## Open shell in API container
	docker-compose exec api /bin/bash

shell-worker: ## Open shell in worker container
	docker-compose exec worker /bin/bash

db-shell: ## Open SQLite database shell
	sqlite3 data/data.db

ps: ## Show running containers
	docker-compose ps

stats: ## Show container stats
	docker stats --no-stream

metrics: ## Show application metrics
	@curl -s http://localhost:8000/api/metrics | python3 -m json.tool

backup: ## Backup data directory
	@echo "$(BLUE)Creating backup...$(NC)"
	@BACKUP_NAME=backup-$$(date +%Y%m%d-%H%M%S).tar.gz && \
	tar -czf $$BACKUP_NAME data/ && \
	echo "$(GREEN)✅ Backup created: $$BACKUP_NAME$(NC)"

.PHONY: all
all: lint test build ## Run lint, test, and build
