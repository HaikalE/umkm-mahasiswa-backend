#!/bin/bash

# UMKM Mahasiswa Backend Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environment: development|staging|production

set -e

ENVIRONMENT=${1:-development}
APP_NAME="umkm-mahasiswa-backend"
DOCKER_IMAGE="$APP_NAME:latest"

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if required environment file exists
if [ "$ENVIRONMENT" = "production" ]; then
    ENV_FILE=".env.production"
else
    ENV_FILE=".env"
fi

if [ ! -f "$ENV_FILE" ]; then
    print_error "Environment file $ENV_FILE not found!"
    print_warning "Please copy .env.example to $ENV_FILE and configure it."
    exit 1
fi

print_status "Environment file $ENV_FILE found ✓"

# Build Docker image
print_status "Building Docker image..."
if [ "$ENVIRONMENT" = "production" ]; then
    docker build -f Dockerfile.prod -t $DOCKER_IMAGE .
else
    docker build -t $DOCKER_IMAGE .
fi

if [ $? -eq 0 ]; then
    print_success "Docker image built successfully"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Start services based on environment
print_status "Starting services for $ENVIRONMENT environment..."
if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
else
    docker-compose up -d
fi

if [ $? -eq 0 ]; then
    print_success "Services started successfully"
else
    print_error "Failed to start services"
    exit 1
fi

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check if database is ready
print_status "Checking database connection..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_success "Database is ready"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Database failed to start after $max_attempts attempts"
        exit 1
    fi
    
    print_status "Waiting for database... (attempt $attempt/$max_attempts)"
    sleep 2
    attempt=$((attempt + 1))
done

# Run database migrations
print_status "Running database migrations..."
docker-compose exec -T api npm run db:migrate

if [ $? -eq 0 ]; then
    print_success "Database migrations completed"
else
    print_error "Database migrations failed"
    exit 1
fi

# Seed database (only for development)
if [ "$ENVIRONMENT" = "development" ]; then
    print_status "Seeding database with sample data..."
    docker-compose exec -T api npm run db:seed
    
    if [ $? -eq 0 ]; then
        print_success "Database seeded successfully"
    else
        print_warning "Database seeding failed (this is optional for development)"
    fi
fi

# Health check
print_status "Performing health check..."
sleep 5

if [ "$ENVIRONMENT" = "production" ]; then
    HEALTH_URL="http://localhost/health"
else
    HEALTH_URL="http://localhost:3000/health"
fi

response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL 2>/dev/null || echo "000")

if [ "$response" = "200" ]; then
    print_success "Health check passed ✓"
else
    print_error "Health check failed (HTTP $response)"
    print_warning "Check logs with: docker-compose logs api"
    exit 1
fi

# Display running services
print_status "Checking running services..."
docker-compose ps

echo ""
print_success "🎉 Deployment completed successfully!"
echo ""
print_status "Application is running at:"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "   🌐 API: http://localhost/api"
    echo "   📚 Documentation: http://localhost/api/docs"
    echo "   ❤️  Health Check: http://localhost/health"
else
    echo "   🌐 API: http://localhost:3000/api"
    echo "   📚 Documentation: http://localhost:3000/api/docs"
    echo "   ❤️  Health Check: http://localhost:3000/health"
fi
echo ""
print_status "Useful commands:"
echo "   📋 View logs: docker-compose logs -f api"
echo "   🔍 Check status: docker-compose ps"
echo "   🛑 Stop services: docker-compose down"
echo "   🗄️  Database shell: docker-compose exec postgres psql -U postgres -d umkm_mahasiswa_db"
echo ""
if [ "$ENVIRONMENT" = "development" ]; then
    print_status "Demo accounts (password: password123):"
    echo "   📧 UMKM: warung.makan.sederhana@gmail.com"
    echo "   📧 Student: andi.mahasiswa@gmail.com"
fi