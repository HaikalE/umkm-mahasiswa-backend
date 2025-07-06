#!/bin/bash

# Make scripts executable
echo "Making scripts executable..."

chmod +x scripts/deploy.sh
chmod +x scripts/setup.sh
chmod +x scripts/test.sh
chmod +x scripts/chmod.sh

echo "✅ All scripts are now executable"
echo "📝 Available scripts:"
echo "   ./scripts/setup.sh    - Setup development environment"
echo "   ./scripts/deploy.sh   - Deploy application"
echo "   ./scripts/test.sh     - Run comprehensive tests"
echo "   ./scripts/chmod.sh    - Make scripts executable"