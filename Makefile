.PHONY: help build build-dev up-build-all up-build-dev down down-dev restart restart-dev logs logs-dev ps ps-dev

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ''
	@echo 'Note: Service profiles are controlled by ENABLE_* flags in .env file'
	@echo '      docker-compose will automatically respect these flags'

build: ## Build all Docker images
	docker-compose build

build-dev: ## Build all Docker images in dev mode (skips type checks)
	docker-compose -f docker-compose.dev.yml build

up-build-all: ## Build and start all services including optional ones
	@./scripts/docker-compose-with-profiles.sh docker-compose.yml up -d --build --force-recreate --remove-orphans

up-build-dev: ## Build and start all services in dev mode (skips type checks)
	@./scripts/docker-compose-with-profiles.sh docker-compose.dev.yml up -d --build --force-recreate --remove-orphans

down: ## Stop all services
	docker-compose down

down-dev: ## Stop all services in dev mode
	docker-compose -f docker-compose.dev.yml down

restart: ## Restart all services
	docker-compose restart

restart-dev: ## Restart all services in dev mode
	docker-compose -f docker-compose.dev.yml restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-dev: ## Show logs from all services in dev mode
	docker-compose -f docker-compose.dev.yml logs -f

ps: ## Show running containers
	docker-compose ps

ps-dev: ## Show running containers in dev mode
	docker-compose -f docker-compose.dev.yml ps
