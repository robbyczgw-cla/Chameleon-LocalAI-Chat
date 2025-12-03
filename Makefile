# ===================================
# Chameleon Chat - Makefile
# ===================================
# Usage: make <command>
# Help:  make help

.PHONY: help install dev build start clean docker docker-up docker-down backup

# Default target
help:
	@echo "🦎 Chameleon Chat - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Start development server"
	@echo "  make build      - Build for production"
	@echo "  make start      - Start production server"
	@echo "  make clean      - Remove build artifacts"
	@echo ""
	@echo "Docker:"
	@echo "  make docker     - Build Docker image"
	@echo "  make docker-up  - Start with Docker Compose"
	@echo "  make docker-down - Stop Docker Compose"
	@echo ""
	@echo "Utilities:"
	@echo "  make backup     - Backup SQLite database"
	@echo "  make lint       - Run linter"
	@echo ""

# Development
install:
	@echo "📦 Installing dependencies..."
	npm install

dev:
	@echo "🚀 Starting development server..."
	npm run dev

build:
	@echo "🔨 Building for production..."
	npm run build

start:
	@echo "🚀 Starting production server..."
	npm start

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf .next
	rm -rf node_modules/.cache
	@echo "✅ Clean complete"

# Docker
docker:
	@echo "🐳 Building Docker image..."
	docker build -t chameleon-chat .

docker-up:
	@echo "🐳 Starting with Docker Compose..."
	docker-compose up -d
	@echo "✅ Running at http://localhost:3000"

docker-down:
	@echo "🐳 Stopping Docker Compose..."
	docker-compose down

# Utilities
backup:
	@echo "💾 Backing up database..."
	@mkdir -p backups
	@cp data/chameleon.db backups/chameleon-$$(date +%Y%m%d-%H%M%S).db 2>/dev/null || echo "No database found"
	@echo "✅ Backup saved to backups/"

lint:
	@echo "🔍 Running linter..."
	npm run lint

# Quick start for new users
quickstart: install dev
