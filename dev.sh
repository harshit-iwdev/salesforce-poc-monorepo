#!/usr/bin/env bash
set -e

# Ensure node & npm are in PATH
export PATH=$PATH:/home/infowind/.nvm/versions/node/v26.8.1/bin:~/.nvm/versions/node/$(ls ~/.nvm/versions/node 2>/dev/null | tail -n 1)/bin

# Auto-free ports
fuser -k 8000/tcp 3001/tcp 3000/tcp 2>/dev/null || true

echo "🚀 Starting Salesforce POC Backend (:8000) and Frontend (:3001) concurrently..."

npx concurrently -p "[{name}]" -n "BACKEND,FRONTEND" -c "blue.bold,cyan.bold" \
  "npm --prefix salesforce-poc-be run dev" \
  "npm --prefix salesforce-poc-fe run dev"
