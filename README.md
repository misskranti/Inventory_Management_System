# Inventory Management System (FIFO) - Real-Time Dashboard

A comprehensive inventory management system built with FIFO (First-In-First-Out) costing methodology, featuring real-time data ingestion through Kafka and a live dashboard.

---

## 🚀 Quick Start (Docker Compose)

**Recommended: Run the entire stack (frontend, backend, PostgreSQL, Kafka) with one command!**

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- (Optional) [Git](https://git-scm.com/)

### 2. Clone the Repository
```bash
git clone https://github.com/misskranti/Inventory_Management_System.git
cd Inventory_Management_System
```

### 3. Start All Services
```bash
docker-compose up --build -d
```
This will start:
- **PostgreSQL** (database)
- **Kafka & Zookeeper** (message broker)
- **Backend API** (Express.js)
- **Frontend** (Next.js dashboard)

### 4. Access the Dashboard
- Open: [https://inventory-management-production-29ab.up.railway.app/](https://inventory-management-production-29ab.up.railway.app/)
- **Login Credentials:**
  - Username: `admin`
  - Password: `inventory123`

### 5. Kafka Event Simulator (Frontend)
- After login, scroll to the **Kafka Event Simulator** section.
- Use:
  - **Send Single Event**: Sends a random purchase or sale event.
  - **Start Auto Simulator (20s)**: Sends random events every 2 seconds for 20 seconds.
- Watch the dashboard update in real-time!

### 6. Stopping the Stack
```bash
docker-compose down
```

---

## 🛠️ Environment Variables (Docker Compose)

All required environment variables are set in `docker-compose.yml`. No manual `.env` setup is needed for local Docker Compose runs.

- **Backend** uses:
  - `DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/inventory_management`
  - `KAFKA_BROKER_URL=kafka:29092`
- **Frontend** uses:
  - `NEXT_PUBLIC_BACKEND_URL=http://backend:3001`
  - `KAFKA_BROKER_URL=kafka:29092`
  - `NEXTAUTH_SECRET` (already set)

---

## 📦 Project Structure
- `app/` - Next.js frontend
- `backend/` - Express.js backend API
- `scripts/` - Kafka producer/consumer/test scripts
- `docker-compose.yml` - Orchestrates all services

---

## 🎯 Key Features
- FIFO costing logic (accurate inventory valuation)
- Real-time event ingestion via Kafka
- Live dashboard with instant updates
- Kafka event simulator (from frontend UI)
- Dockerized for easy local and cloud deployment

---

## 🧪 Testing Kafka Integration

You can also send test events directly to Kafka from inside the backend container:

```bash
docker exec inventory-backend node test-kafka.js
```

Or, use the scripts in the `scripts/` directory (requires Node.js and dependencies):
```bash
cd scripts
npm install
node kafka-producer.js
```

---

## 🗄️ Database Schema & FIFO Logic
- See `scripts/init-database.sql` and `scripts/seed-data.sql` for schema and sample data.
- FIFO logic is implemented in the backend and PostgreSQL functions.

---

## 📡 API Endpoints
- `GET /api/inventory` - Get current inventory state
- `GET /api/products` - List all products
- `GET /api/transactions` - Get transaction history
- `GET /api/batches` - Get inventory batches

---

## 📝 Assignment/Project Highlights
- Real-time inventory management with FIFO costing
- Kafka-powered event-driven architecture
- Modern, responsive dashboard
- Fully containerized (easy to run anywhere)

---

## 🙋‍♂️ Support
- Create an issue on GitHub
- See `explanation.txt` for a full system flow and diagram

---

**Built with ❤️ for efficient inventory management**
