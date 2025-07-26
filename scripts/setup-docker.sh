#!/bin/bash

# Inventory Management System - Docker Setup Script

echo "🚀 Setting up Inventory Management System with Docker..."

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

echo "✅ Docker and Docker Compose are installed"

# Create .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/inventory_management

# Kafka Configuration
KAFKA_BROKER_URL=localhost:9092

# NextAuth Configuration
NEXTAUTH_SECRET=5644c212a72a209d0bff18a20834c55461dca6c06266ab9273e1dc8e7b2c871a
NEXTAUTH_URL=http://localhost:3000

# Application Configuration
NODE_ENV=development
EOF
    echo "✅ Created .env.local file"
else
    echo "✅ .env.local file already exists"
fi

# Start the infrastructure services (PostgreSQL, Kafka, Zookeeper)
echo "🐳 Starting infrastructure services..."
docker-compose -f docker-compose.dev.yml up -d postgres zookeeper kafka kafka-ui

echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are healthy
echo "🔍 Checking service health..."

# Check PostgreSQL
if docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U postgres; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready. Please check the logs."
    exit 1
fi

# Check Kafka
if docker-compose -f docker-compose.dev.yml exec kafka kafka-topics --bootstrap-server localhost:9092 --list; then
    echo "✅ Kafka is ready"
else
    echo "❌ Kafka is not ready. Please check the logs."
    exit 1
fi

echo ""
echo "🎉 Infrastructure services are ready!"
echo ""
echo "📊 Service URLs:"
echo "   - PostgreSQL: localhost:5432"
echo "   - Kafka: localhost:9092"
echo "   - Kafka UI: http://localhost:8080"
echo ""
echo "🚀 Next steps:"
echo "   1. Install dependencies: npm install"
echo "   2. Start the application: npm run dev"
echo "   3. Open http://localhost:3000 in your browser"
echo ""
echo "📝 Useful commands:"
echo "   - View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "   - Stop services: docker-compose -f docker-compose.dev.yml down"
echo "   - Restart services: docker-compose -f docker-compose.dev.yml restart" 