.PHONY: up down build logs

up:
	docker compose up -d --build
	@echo "\n✅ Rodando em http://localhost:3000"

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f app
