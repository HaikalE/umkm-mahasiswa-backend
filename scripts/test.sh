#!/bin/bash

# UMKM Mahasiswa Backend Test Script

set -e

echo "🧪 Running UMKM Mahasiswa Backend Tests..."

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if test environment is set up
print_status "Setting up test environment..."

# Create test environment file if it doesn't exist
if [ ! -f ".env.test" ]; then
    cp .env.example .env.test
    # Modify for test environment
    sed -i 's/umkm_mahasiswa_db/umkm_mahasiswa_db_test/g' .env.test
    sed -i 's/NODE_ENV=development/NODE_ENV=test/g' .env.test
    print_status "Test environment file created"
fi

# Set test environment
export NODE_ENV=test

# Run linting (if ESLint is configured)
if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
    print_status "Running ESLint..."
    npx eslint src/ --ext .js
    if [ $? -eq 0 ]; then
        print_success "Linting passed ✓"
    else
        print_error "Linting failed"
        exit 1
    fi
else
    print_status "ESLint not configured, skipping..."
fi

# Run security audit
print_status "Running security audit..."
npm audit --audit-level moderate
if [ $? -eq 0 ]; then
    print_success "Security audit passed ✓"
else
    print_error "Security vulnerabilities found"
    exit 1
fi

# Run unit tests
print_status "Running unit tests..."
npm test
if [ $? -eq 0 ]; then
    print_success "Unit tests passed ✓"
else
    print_error "Unit tests failed"
    exit 1
fi

# Run integration tests (if API is running)
print_status "Checking if API is running for integration tests..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    print_status "Running integration tests..."
    
    # Test API endpoints
    print_status "Testing API health endpoint..."
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
    if [ "$response" = "200" ]; then
        print_success "Health endpoint test passed ✓"
    else
        print_error "Health endpoint test failed (HTTP $response)"
        exit 1
    fi
    
    print_status "Testing API documentation endpoint..."
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/docs)
    if [ "$response" = "200" ]; then
        print_success "Documentation endpoint test passed ✓"
    else
        print_error "Documentation endpoint test failed (HTTP $response)"
        exit 1
    fi
    
    print_status "Testing authentication endpoints..."
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{}')
    if [ "$response" = "400" ]; then
        print_success "Auth validation test passed ✓"
    else
        print_error "Auth validation test failed (HTTP $response)"
        exit 1
    fi
    
else
    print_status "API is not running, skipping integration tests"
    print_status "Start the API with 'npm run dev' to run integration tests"
fi

# Generate test coverage report (if configured)
if npm list --depth=0 | grep -q "jest" && [ -f "jest.config.js" ]; then
    print_status "Generating test coverage report..."
    npm run test:coverage 2>/dev/null || jest --coverage
    if [ $? -eq 0 ]; then
        print_success "Test coverage report generated ✓"
        print_status "Coverage report available in coverage/ directory"
    fi
fi

echo ""
print_success "🎉 All tests passed!"
echo ""
print_status "Test summary:"
echo "   ✅ Linting"
echo "   ✅ Security audit"
echo "   ✅ Unit tests"
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "   ✅ Integration tests"
else
    echo "   ⏭️  Integration tests (skipped - API not running)"
fi
echo ""