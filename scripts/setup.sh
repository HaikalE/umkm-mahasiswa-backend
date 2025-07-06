#!/bin/bash

# UMKM Mahasiswa Backend Setup Script
# This script sets up the development environment

set -e

APP_NAME="UMKM Mahasiswa Backend"
NODE_VERSION="18"

echo "🚀 Setting up $APP_NAME development environment..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check Node.js version
print_status "Checking Node.js version..."
if command -v node > /dev/null 2>&1; then
    NODE_CURRENT=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_CURRENT" -ge "$NODE_VERSION" ]; then
        print_success "Node.js $(node -v) is installed ✓"
    else
        print_error "Node.js version $NODE_VERSION or higher is required. Current: $(node -v)"
        exit 1
    fi
else
    print_error "Node.js is not installed. Please install Node.js $NODE_VERSION or higher."
    exit 1
fi

# Check npm
print_status "Checking npm..."
if command -v npm > /dev/null 2>&1; then
    print_success "npm $(npm -v) is installed ✓"
else
    print_error "npm is not installed. Please install npm."
    exit 1
fi

# Check Docker
print_status "Checking Docker..."
if command -v docker > /dev/null 2>&1; then
    if docker info > /dev/null 2>&1; then
        print_success "Docker $(docker -v | cut -d' ' -f3 | sed 's/,//') is running ✓"
    else
        print_warning "Docker is installed but not running. Please start Docker."
    fi
else
    print_warning "Docker is not installed. You can still run the app locally without Docker."
fi

# Check Docker Compose
print_status "Checking Docker Compose..."
if command -v docker-compose > /dev/null 2>&1; then
    print_success "Docker Compose $(docker-compose -v | cut -d' ' -f4 | sed 's/,//') is installed ✓"
else
    print_warning "Docker Compose is not installed. Required for containerized deployment."
fi

# Check PostgreSQL (local installation)
print_status "Checking PostgreSQL..."
if command -v psql > /dev/null 2>&1; then
    print_success "PostgreSQL is installed ✓"
else
    print_warning "PostgreSQL is not installed locally. You can use Docker or install it separately."
fi

# Install dependencies
print_status "Installing npm dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Setup environment file
print_status "Setting up environment configuration..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_success "Environment file created from template"
    print_warning "Please edit .env file with your configuration before running the app"
else
    print_warning ".env file already exists, skipping..."
fi

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs
print_success "Logs directory created"

# Setup Git hooks (optional)
if [ -d ".git" ]; then
    print_status "Setting up Git hooks..."
    if [ ! -f ".git/hooks/pre-commit" ]; then
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# Pre-commit hook for code quality

echo "Running pre-commit checks..."

# Run tests
npm test
if [ $? -ne 0 ]; then
    echo "Tests failed. Commit aborted."
    exit 1
fi

echo "Pre-commit checks passed!"
EOF
        chmod +x .git/hooks/pre-commit
        print_success "Git pre-commit hook installed"
    else
        print_warning "Git pre-commit hook already exists"
    fi
fi

echo ""
print_success "🎉 Setup completed successfully!"
echo ""
print_status "Next steps:"
echo "   1. 📝 Edit .env file with your configuration"
echo "   2. 🗄️  Setup PostgreSQL database"
echo "   3. 🔥 Configure Firebase authentication"
echo "   4. ☁️  Setup Cloudinary for file uploads"
echo ""
print_status "Quick start commands:"
echo "   🐳 With Docker: ./scripts/deploy.sh development"
echo "   💻 Local development: npm run dev"
echo "   🧪 Run tests: npm test"
echo "   🗄️  Create database: npm run db:create"
echo "   📊 Run migrations: npm run db:migrate"
echo "   🌱 Seed database: npm run db:seed"
echo ""
print_status "Documentation:"
echo "   📚 API docs will be available at: http://localhost:3000/api/docs"
echo "   ❤️  Health check: http://localhost:3000/health"
echo ""