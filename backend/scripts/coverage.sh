#!/bin/bash
# Run tests with coverage and generate report
# Usage: ./scripts/coverage.sh

set -e

echo "Installing cargo-llvm-cov..."
cargo install cargo-llvm-cov --locked || true

echo "Creating coverage directory..."
mkdir -p coverage/html

echo "Running tests with coverage..."
cd "$(dirname "$0")/.." || exit 1

# Run tests with coverage and generate LCOV report
cargo llvm-cov --all-features --workspace --lcov --output-path coverage/lcov.info

# Generate HTML report
cargo llvm-cov --all-features --workspace --html --output-dir coverage/html

echo ""
echo "✓ Coverage report generated!"
echo "  - LCOV report: coverage/lcov.info"
echo "  - HTML report: coverage/html/index.html"
echo ""
echo "Open coverage/html/index.html in your browser to view the report."

