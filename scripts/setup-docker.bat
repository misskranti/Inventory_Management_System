@echo off
REM Inventory Management System - Docker Setup Script for Windows

echo 🚀 Setting up Inventory Management System with Docker...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are installed

REM Create .env.local file if it doesn't exist
if not exist .env.local (
    echo 📝 Creating .env.local file...
    (
        echo # Database Configuration
        echo DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/inventory_management
        echo.
        echo # Kafka Configuration
        echo KAFKA_BROKER_URL=localhost:9092
        echo.
        echo # NextAuth Configuration
        echo NEXTAUTH_SECRET=your-secret-key-here-change-in-production
        echo NEXTAUTH_URL=http://localhost:3000
        echo.
        echo # Application Configuration
        echo NODE_ENV=development
    ) > .env.local
    echo ✅ Created .env.local file
) else (
    echo ✅ .env.local file already exists
)

REM Start the infrastructure services (PostgreSQL, Kafka, Zookeeper)
echo 🐳 Starting infrastructure services...
docker-compose -f docker-compose.dev.yml up -d postgres zookeeper kafka kafka-ui

echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check if services are healthy
echo 🔍 Checking service health...

REM Check PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U postgres
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL is ready
) else (
    echo ❌ PostgreSQL is not ready. Please check the logs.
    pause
    exit /b 1
)

REM Check Kafka
docker-compose -f docker-compose.dev.yml exec kafka kafka-topics --bootstrap-server localhost:9092 --list
if %errorlevel% equ 0 (
    echo ✅ Kafka is ready
) else (
    echo ❌ Kafka is not ready. Please check the logs.
    pause
    exit /b 1
)

echo.
echo 🎉 Infrastructure services are ready!
echo.
echo 📊 Service URLs:
echo    - PostgreSQL: localhost:5432
echo    - Kafka: localhost:9092
echo    - Kafka UI: http://localhost:8080
echo.
echo 🚀 Next steps:
echo    1. Install dependencies: npm install
echo    2. Start the application: npm run dev
echo    3. Open http://localhost:3000 in your browser
echo.
echo 📝 Useful commands:
echo    - View logs: docker-compose -f docker-compose.dev.yml logs -f
echo    - Stop services: docker-compose -f docker-compose.dev.yml down
echo    - Restart services: docker-compose -f docker-compose.dev.yml restart

pause 