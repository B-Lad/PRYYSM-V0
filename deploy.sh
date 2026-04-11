#!/bin/bash
set -e

echo "====================================="
echo "  Pryysm MES v3.0 - Local Deployment"
echo "====================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"

# Step 1: Setup environment files
echo ""
echo "[1/4] Setting up environment files..."

# Root .env for docker-compose
if [ ! -f .env ]; then
    cp .env.example .env
    echo "  ✓ Created .env from .env.example"
fi

# Backend .env
if [ ! -f backend/.env ]; then
    cat > backend/.env << 'EOF'
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/pryysm_db
SECRET_KEY=dev-secret-key-change-in-prod
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF
    echo "  ✓ Created backend/.env"
fi

# Frontend .env
if [ ! -f frontend/.env ]; then
    cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:8000
EOF
    echo "  ✓ Created frontend/.env"
fi

# Step 2: Stop any running containers
echo ""
echo "[2/4] Stopping existing containers..."
docker compose down 2>/dev/null || echo "  (No running containers to stop)"

# Step 3: Build and start services
echo ""
echo "[3/4] Building and starting services..."
docker compose up -d --build

# Step 4: Wait and verify
echo ""
echo "[4/4] Waiting for services to be ready..."
sleep 10

# Check service health
echo ""
echo "====================================="
echo "  Service Status"
echo "====================================="
docker compose ps

echo ""
echo "====================================="
echo "  ✅ Deployment Complete!"
echo "====================================="
echo ""
echo "  Frontend:    http://localhost"
echo "  Backend API: http://localhost/api"
echo "  API Docs:    http://localhost/api/docs"
echo "  Database:    localhost:5432"
echo ""
echo "  Useful commands:"
echo "    docker compose logs -f        # View logs"
echo "    docker compose down           # Stop all services"
echo "    docker compose restart        # Restart services"
echo "    ./scripts/reset.sh            # Full reset with data clear"
echo ""
