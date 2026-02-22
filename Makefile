.PHONY: dev frontend engine install lint build clean health help

dev: ## Run frontend + engine together
	@trap 'kill 0' EXIT; \
		cd engine && bun run index.js & \
		bun run dev & \
		wait

frontend: ## Run frontend only
	bun run dev

engine: ## Run engine only
	cd engine && bun run index.js

install: ## Install all dependencies
	bun install
	cd engine && bun install

lint: ## Run linter
	bun run lint

build: ## Production build
	bun run build

health: ## Ping engine health endpoint
	@curl -s http://localhost:8080/health | python3 -m json.tool

clean: ## Remove build artifacts and node_modules
	rm -rf dist node_modules engine/node_modules

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
