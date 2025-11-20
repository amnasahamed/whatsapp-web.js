#!/bin/bash
# ================================
# Quick Deployment Script
# ================================

set -e

echo "🚀 WhatsApp Command Center - Quick Deploy"
echo "=========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "📝 Please copy .env.example to .env and configure your environment variables"
    exit 1
fi

# Load environment variables
source .env

# Choose deployment mode
echo ""
echo "Select deployment mode:"
echo "1) Development (with hot reload)"
echo "2) Production (optimized build)"
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        echo "🔧 Starting development environment..."
        docker-compose -f docker-compose.dev.yml up -d

        echo "⏳ Waiting for services to be ready..."
        sleep 10

        echo "📦 Running database migrations..."
        docker-compose -f docker-compose.dev.yml exec app npx prisma migrate dev

        echo "✅ Development environment ready!"
        echo "🌐 App: http://localhost:3000"
        echo "🗄️  Prisma Studio: Run 'docker-compose -f docker-compose.dev.yml --profile tools up prisma-studio'"
        echo "📊 To view logs: docker-compose -f docker-compose.dev.yml logs -f app"
        ;;
    2)
        echo "🏭 Starting production environment..."

        # Build the image
        echo "🔨 Building production image..."
        docker-compose build

        # Start services
        echo "🚀 Starting services..."
        docker-compose up -d

        echo "⏳ Waiting for services to be healthy..."
        sleep 15

        # Run migrations
        echo "📦 Running database migrations..."
        docker-compose exec app npx prisma migrate deploy

        # Check health
        echo "🏥 Checking application health..."
        for i in {1..30}; do
            if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
                echo "✅ Application is healthy!"
                break
            fi
            echo "⏳ Waiting for app to be ready... ($i/30)"
            sleep 2
        done

        echo "✅ Production environment ready!"
        echo "🌐 App: http://localhost:3000"
        echo "📊 To view logs: docker-compose logs -f app"
        echo "📈 Monitor: docker-compose ps"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Useful commands:"
echo "  docker-compose ps              - View running services"
echo "  docker-compose logs -f app     - View application logs"
echo "  docker-compose down            - Stop all services"
echo "  docker-compose down -v         - Stop and remove volumes"
