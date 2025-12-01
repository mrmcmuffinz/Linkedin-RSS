#!/bin/bash
set -e  # Exit on any error

echo "Starting full cleanup, test, and build..."
echo ""

# Clean
echo "Step 1/11: Cleaning up..."
rm -rf node_modules package-lock.json dist coverage __tests__/temp

# Cache
echo "Step 2/11: Clearing npm cache..."
npm cache clean --force

# Install
echo "Step 3/11: Installing dependencies..."
npm install

# Lint
echo "Step 4/11: Running linter..."
npm run lint

# Format
echo "Step 5/11: Running formatter..."
npm run format

# Test
echo "Step 6/11: Running tests..."
npm test

# Coverage
echo "Step 7/11: Running tests with coverage..."
npm run test:coverage

# Build
echo "Step 8/11: Building action..."
npm run build

# Verify
echo "Step 9/11: Verifying build..."
if [ -f "dist/index.js" ]; then
  echo "   dist/index.js exists"
  echo "   Size: $(du -h dist/index.js | cut -f1)"
else
  echo "   ERROR: dist/index.js not found!"
  exit 1
fi

# Pre-commit checks
echo "Step 10/11: Running pre-commit checks (gitleaks)..."
if command -v pre-commit &> /dev/null; then
  pre-commit run --all-files
else
  echo "   WARNING: pre-commit not installed, skipping gitleaks check"
  echo "   Install with: pip install pre-commit"
fi

# Status
echo "Step 11/11: Git status"
git status --short

echo ""
echo "Success! All checks passed."
echo ""
