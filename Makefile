.PHONY: help build build-dev up-build-all up-build-dev down down-dev restart restart-dev logs logs-dev ps ps-dev \
	sonar-up sonar-down sonar-logs sonar-status sonar-scan-backend sonar-scan-admin-ui sonar-scan-client-app sonar-scan-all sonar-setup \
	build-backend-local up-with-local-build setup-admin-local

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

# SonarQube targets
sonar-up: ## Start SonarQube service with separate database (or set ENABLE_SONARQUBE=true in .env)
	@if [ -f .env ] && grep -qiE "^[[:space:]]*ENABLE_SONARQUBE[[:space:]]*=[[:space:]]*true" .env 2>/dev/null; then \
		echo "SonarQube is enabled in .env, starting with docker-compose..."; \
		docker-compose --profile sonarqube up -d postgres-sonar sonarqube; \
	else \
		echo "Starting SonarQube with separate database..."; \
		echo "To enable automatically, add ENABLE_SONARQUBE=true to your .env file"; \
		docker-compose --profile sonarqube up -d postgres-sonar sonarqube; \
	fi
	@echo "SonarQube starting... Access at http://localhost:$${SONARQUBE_PORT:-9000}"
	@echo "Default credentials: admin/admin (change on first login)"
	@echo "SonarQube uses its own PostgreSQL database (postgres-sonar) on port $${SONARQUBE_DB_PORT:-5444}"

sonar-down: ## Stop SonarQube service and its database
	docker-compose --profile sonarqube down sonarqube postgres-sonar

sonar-logs: ## Show SonarQube logs
	docker-compose --profile sonarqube logs -f sonarqube

sonar-status: ## Check SonarQube status
	@echo "Checking SonarQube status..."
	@curl -s http://localhost:$${SONARQUBE_PORT:-9000}/api/system/status || echo "SonarQube is not running or not accessible"

sonar-scan-backend: ## Scan backend (Rust) code with SonarQube
	@if [ -z "$$SONAR_TOKEN" ]; then \
		echo "Error: SONAR_TOKEN environment variable is not set"; \
		echo "Get your token from SonarQube: http://localhost:$${SONARQUBE_PORT:-9000}"; \
		exit 1; \
	fi
	@./scripts/sonar-scan.sh backend

sonar-scan-admin-ui: ## Scan admin UI (TypeScript/React) code with SonarQube
	@if [ -z "$$SONAR_TOKEN" ]; then \
		echo "Error: SONAR_TOKEN environment variable is not set"; \
		echo "Get your token from SonarQube: http://localhost:$${SONARQUBE_PORT:-9000}"; \
		exit 1; \
	fi
	@./scripts/sonar-scan.sh admin-ui

sonar-scan-client-app: ## Scan client app (TypeScript/React) code with SonarQube
	@if [ -z "$$SONAR_TOKEN" ]; then \
		echo "Error: SONAR_TOKEN environment variable is not set"; \
		echo "Get your token from SonarQube: http://localhost:$${SONARQUBE_PORT:-9000}"; \
		exit 1; \
	fi
	@./scripts/sonar-scan.sh client-app

sonar-scan-all: ## Scan all projects (backend, admin-ui, client-app) with SonarQube
	@if [ -z "$$SONAR_TOKEN" ]; then \
		echo "Error: SONAR_TOKEN environment variable is not set"; \
		echo "Get your token from SonarQube: http://localhost:$${SONARQUBE_PORT:-9000}"; \
		exit 1; \
	fi
	@./scripts/sonar-scan.sh all
