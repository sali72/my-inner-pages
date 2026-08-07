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
	cd backend && RATE_LIMIT_ENABLED=true uv run --frozen pytest -q --tb=short

test: check
	cd frontend && npm test

release: check
	test -n "$(tag)" || (echo "Error: Please specify tag, e.g. make release tag=v0.5.0-alpha" && exit 1)
	git tag -a $(tag) -m "Release $(tag)"
	git push origin $(tag)

install-hooks:
	mkdir -p .git/hooks
	printf '#!/bin/sh\nBRANCH=$$(git rev-parse --abbrev-ref HEAD)\n\nif [ "$$BRANCH" != "main" ]; then\n    exit 0\nfi\n\necho "Running pre-commit checks on main branch..."\nmake check || {\n    echo "Pre-commit check failed! Fix errors before committing to main."\n    exit 1\n}\n\nif [ -f backend/uv.lock ]; then\n    git add backend/uv.lock 2>/dev/null\nfi\n' > .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit
