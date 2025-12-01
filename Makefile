.PHONY: help build build-dev up-build-all up-build-dev down down-dev restart restart-dev logs logs-dev ps ps-dev

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker images
	docker-compose build

build-dev: ## Build all Docker images in dev mode (skips type checks)
	docker-compose -f docker-compose.dev.yml build

up-build-all: ## Build and start all services including optional ones
	docker-compose --profile client --profile localstack --profile nats --profile kafka up -d --build --force-recreate --remove-orphans

up-build-dev: ## Build and start all services in dev mode (skips type checks)
	docker-compose -f docker-compose.dev.yml --profile client --profile localstack --profile nats --profile kafka up -d --build --force-recreate --remove-orphans

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
