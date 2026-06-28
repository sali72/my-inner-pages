.PHONY: run backend frontend stop

backend:
	cd backend && uv run uvicorn app.main:app --reload

frontend:
	cd frontend && npm run dev

run:
	trap 'kill 0' EXIT; \
		$(MAKE) backend & \
		$(MAKE) frontend

stop:
	-pkill -f "fastapi dev" 2>/dev/null
	-pkill -f "vite" 2>/dev/null
