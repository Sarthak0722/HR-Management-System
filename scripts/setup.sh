#!/bin/bash

# HRMS Setup Script
echo "🚀 Setting up HR Management System..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first:"
    echo "npm install -g pnpm"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update .env file with your configuration before proceeding."
    echo "   Especially set your GROQ_API_KEY for the RAG service to work."
    read -p "Press Enter to continue after updating .env file..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm --filter auth-service db:generate

# Start database
echo "🐘 Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations
echo "🗄️  Running database migrations..."
pnpm --filter auth-service db:migrate

# Seed database
echo "🌱 Seeding database..."
pnpm --filter auth-service db:seed

echo "✅ Setup complete!"
echo ""
echo "🎉 You can now start the application:"
echo "   Development mode: pnpm dev"
echo "   Docker mode: docker-compose up -d"
echo ""
echo "📚 Access points:"
echo "   Frontend: http://localhost:3000"
echo "   Auth Service API: http://localhost:3001/docs"
echo "   HR Service API: http://localhost:3002/docs"
echo "   Employee Service API: http://localhost:3003/docs"
echo "   RAG Service API: http://localhost:3004/docs"
echo ""
echo "🔐 Demo credentials:"
echo "   HR: hr@company.com / hr123456"
echo "   Employee: employee@company.com / emp123456"
