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
	cd frontend && npm run typecheck
	cd backend && uv lock
	cd backend && RATE_LIMIT_ENABLED=true VIRTUAL_ENV="" uv run pytest -q --tb=short

test: check
	cd frontend && npm test

release: check
	test -n "$(tag)" || (echo "Error: Please specify tag, e.g. make release tag=v0.5.0-alpha" && exit 1)
	git tag -a $(tag) -m "Release $(tag)"
	git push origin $(tag)

install-hooks:
	mkdir -p .git/hooks
	printf '#!/bin/sh\nBRANCH=$$(git rev-parse --abbrev-ref HEAD)\n\nif [ "$$BRANCH" != "main" ]; then\n    exit 0\nfi\n\nSTAGED=$$(git diff --cached --name-only)\n\nif echo "$$STAGED" | grep -q "^frontend/"; then\n    echo "Checking frontend types..."\n    (cd frontend && npm run typecheck) || exit 1\nfi\n\nif echo "$$STAGED" | grep -q "^backend/"; then\n    echo "Running backend tests..."\n    (cd backend && RATE_LIMIT_ENABLED=true VIRTUAL_ENV="" uv run pytest -q --tb=short) || exit 1\nfi\n\nif [ -f backend/uv.lock ]; then\n    git add backend/uv.lock 2>/dev/null\nfi\n' > .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit
