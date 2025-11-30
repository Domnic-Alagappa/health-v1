.PHONY: help build up down restart logs clean clean-volumes ps

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker images
	docker-compose build

build-no-cache: ## Build all Docker images without cache
	docker-compose build --no-cache

up: ## Start all core services
	docker-compose up -d

up-all: ## Start all services including optional ones
	docker-compose --profile client --profile localstack --profile nats --profile kafka up -d

up-build: ## Build and start all core services
	docker-compose up -d --build

up-build-all: ## Build and start all services including optional ones
	docker-compose --profile client --profile localstack --profile nats --profile kafka up -d --build

up-client: ## Start with client app
	docker-compose --profile client up -d

up-localstack: ## Start with LocalStack
	docker-compose --profile localstack up -d

up-nats: ## Start with NATS
	docker-compose --profile nats up -d

up-kafka: ## Start with Kafka
	docker-compose --profile kafka up -d

down: ## Stop all services
	docker-compose down

down-volumes: ## Stop all services and remove volumes
	docker-compose down -v

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-auth: ## Show logs from auth-service
	docker-compose logs -f auth-service

logs-admin: ## Show logs from admin-ui
	docker-compose logs -f admin-ui

logs-db: ## Show logs from postgres
	docker-compose logs -f postgres

ps: ## Show running containers
	docker-compose ps

clean: ## Remove stopped containers and unused images
	docker-compose down --rmi local --remove-orphans

clean-volumes: ## Remove all volumes (WARNING: This deletes all data!)
	docker-compose down -v
	docker volume prune -f

clean-all: clean-volumes ## Remove everything including volumes
	docker system prune -af --volumes

shell-auth: ## Open shell in auth-service container
	docker-compose exec auth-service /bin/sh

shell-admin: ## Open shell in admin-ui container
	docker-compose exec admin-ui /bin/sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U auth_user -d auth_db

migrate: ## Run database migrations
	docker-compose exec auth-service ./auth-service migrate || echo "Migrations should run automatically on startup"

health: ## Check health status of all services
	@echo "Checking service health..."
	@docker-compose ps
	@echo "\nAuth Service Health:"
	@curl -s http://localhost:8080/health || echo "❌ Auth service not responding"
	@echo "\nAdmin UI Health:"
	@curl -s http://localhost:5174/health || echo "❌ Admin UI not responding"
	@echo "\nClient App Health:"
	@curl -s http://localhost:5175/health || echo "⚠️  Client App not running (use profile 'client')"
	@echo "\nOpenBao Health:"
	@curl -s http://localhost:8200/v1/sys/health || echo "❌ OpenBao not responding"

setup: ## Initial setup - create .env from example
	@if [ ! -f .env ]; then \
		cp .env.docker.example .env; \
		echo "Created .env file from .env.docker.example"; \
		echo "Please review and update .env with your configuration"; \
	else \
		echo ".env file already exists"; \
	fi

