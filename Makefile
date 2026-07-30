GIT_TAG := $(shell git describe --tags --always 2>/dev/null || echo "dev")

.PHONY: run backend frontend stop check test release install-hooks

backend:
	cd backend && APP_VERSION=$(GIT_TAG) uv run uvicorn app.main:app --reload

frontend:
	cd frontend && npm run dev

run:
	trap 'kill 0' EXIT; \
		$(MAKE) backend & \
		$(MAKE) frontend

stop:
	-pkill -f "fastapi dev" 2>/dev/null
	-pkill -f "vite" 2>/dev/null

check:
	@echo "🔍 Checking frontend TypeScript types..."
	@cd frontend && npm run typecheck
	@echo "🧪 Running backend test suite..."
	@cd backend && RATE_LIMIT_ENABLED=true uv run pytest -q --tb=short

test: check
	@echo "🧪 Running frontend unit tests..."
	@cd frontend && npm test

release: check
	@if [ -z "$(tag)" ]; then \
		echo "❌ Error: Please specify a tag. Example: make release tag=v0.5.0-alpha"; \
		exit 1; \
	fi
	@echo "🚀 Creating git tag $(tag)..."
	git tag -a $(tag) -m "Release $(tag)"
	@echo "⬆️ Pushing tag $(tag) to trigger VPS deployment..."
	git push origin $(tag)
	@echo "✅ Release $(tag) pushed successfully!"

install-hooks:
	@echo "⚓ Installing git pre-commit hook..."
	@mkdir -p .git/hooks
	@echo '#!/bin/sh' > .git/hooks/pre-commit
	@echo 'echo "🔍 Running pre-commit checks (make check)..."' >> .git/hooks/pre-commit
	@echo 'make check || {' >> .git/hooks/pre-commit
	@echo '  echo "❌ Pre-commit check failed! Fix errors before committing."' >> .git/hooks/pre-commit
	@echo '  exit 1' >> .git/hooks/pre-commit
	@echo '}' >> .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "✅ Pre-commit hook installed successfully!"
