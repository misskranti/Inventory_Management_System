# Docker Setup Guide - Inventory Management System

This guide will help you set up the Inventory Management System using Docker containers for PostgreSQL and Kafka, eliminating the need to install these services locally.

## 🏗️ Architecture Overview

The Docker setup includes:
- **PostgreSQL 15** - Database for inventory data
- **Apache Kafka 7.4** - Event streaming platform
- **Zookeeper** - Required for Kafka coordination
- **Kafka UI** - Web interface for monitoring Kafka
- **Next.js Application** - The main application (runs locally for development)

## 📋 Prerequisites

1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
2. **Docker Compose** - Usually included with Docker Desktop
3. **Node.js 18+** - For running the Next.js application locally

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

#### For Linux/Mac:
```bash
# Make the setup script executable
chmod +x scripts/setup-docker.sh

# Run the setup script
npm run docker:setup
```

#### For Windows:
```bash
# Run the Windows setup script
npm run docker:setup:win
```

### Option 2: Manual Setup

1. **Start Infrastructure Services**
   ```bash
   # Start PostgreSQL, Kafka, and Zookeeper
   docker-compose -f docker-compose.dev.yml up -d postgres zookeeper kafka kafka-ui
   ```

2. **Wait for Services to be Ready**
   ```bash
   # Check service status
   docker-compose -f docker-compose.dev.yml ps
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Start the Application**
   ```bash
   npm run dev
   ```

## 📊 Service URLs

Once the services are running, you can access:

- **Application**: http://localhost:3000
- **Kafka UI**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Kafka**: localhost:9092

## 🔧 Environment Configuration

The setup automatically creates a `.env.local` file with the following configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/inventory_management

# Kafka Configuration
KAFKA_BROKER_URL=localhost:9092

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Application Configuration
NODE_ENV=development
```

## 📝 Useful Commands

### Docker Management
```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# View logs
npm run docker:logs

# Restart services
npm run docker:restart
```

### Database Operations
```bash
# Connect to PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d inventory_management

# View database logs
docker-compose -f docker-compose.dev.yml logs postgres

# Reset database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d postgres
```

### Kafka Operations
```bash
# List Kafka topics
docker-compose -f docker-compose.dev.yml exec kafka kafka-topics --bootstrap-server localhost:9092 --list

# View Kafka logs
docker-compose -f docker-compose.dev.yml logs kafka

# Access Kafka UI
# Open http://localhost:8080 in your browser
```

## 🗄️ Database Schema

The PostgreSQL container automatically initializes with the complete database schema from `scripts/create-database.sql`, including:

- **products** - Master product catalog
- **inventory_batches** - FIFO-ordered purchase batches
- **sales** - Sales transactions with FIFO costing
- **transactions** - Complete audit trail
- **sale_batch_details** - Tracks batch consumption per sale

## 🔄 Kafka Topics

The Kafka setup automatically creates the `inventory-events` topic for processing inventory events.

### Event Schema
```json
{
  "product_id": "PRD001",
  "event_type": "purchase|sale",
  "quantity": 100,
  "unit_price": 85.0,
  "timestamp": "2025-01-26T10:00:00Z"
}
```

## 🧪 Testing the Setup

1. **Test Database Connection**
   ```bash
   # Connect to PostgreSQL
   docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d inventory_management -c "SELECT * FROM products;"
   ```

2. **Test Kafka Connection**
   ```bash
   # List topics
   docker-compose -f docker-compose.dev.yml exec kafka kafka-topics --bootstrap-server localhost:9092 --list
   ```

3. **Test Application**
   ```bash
   # Start the application
   npm run dev
   
   # Open http://localhost:3000 in your browser
   ```

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check if ports are in use
   netstat -an | grep :5432
   netstat -an | grep :9092
   
   # Stop conflicting services or change ports in docker-compose.dev.yml
   ```

2. **Docker Not Running**
   ```bash
   # Start Docker Desktop
   # On Windows/Mac: Open Docker Desktop application
   # On Linux: sudo systemctl start docker
   ```

3. **Services Not Starting**
   ```bash
   # Check service logs
   docker-compose -f docker-compose.dev.yml logs

   # Restart services
   docker-compose -f docker-compose.dev.yml down
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. **Database Connection Issues**
   ```bash
   # Check if PostgreSQL is ready
   docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U postgres

   # Reset database
   docker-compose -f docker-compose.dev.yml down -v
   docker-compose -f docker-compose.dev.yml up -d postgres
   ```

### Performance Optimization

1. **Increase Docker Resources**
   - Open Docker Desktop
   - Go to Settings > Resources
   - Increase Memory (recommended: 4GB+)
   - Increase CPU (recommended: 2+ cores)

2. **Database Optimization**
   ```bash
   # Check PostgreSQL performance
   docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d inventory_management -c "SELECT * FROM pg_stat_activity;"
   ```

## 🚀 Production Deployment

For production deployment, consider:

1. **Use the main docker-compose.yml** (includes the application)
2. **Set proper environment variables**
3. **Use external PostgreSQL and Kafka services**
4. **Configure proper security settings**

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)

## 🤝 Support

If you encounter issues:

1. Check the troubleshooting section above
2. View service logs: `npm run docker:logs`
3. Create an issue on GitHub with detailed error information
4. Include your operating system and Docker version

---

**Happy coding! 🎉** 