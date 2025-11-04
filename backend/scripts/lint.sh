#!/bin/bash
# Format and lint script for backend

set -e

echo "🔍 Running ruff linter..."
ruff check app/ --fix

echo "🎨 Running black formatter..."
black app/

echo "✨ Running ruff format..."
ruff format app/

echo "✅ Linting and formatting complete!"
