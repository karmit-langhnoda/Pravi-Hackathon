# Pravi - Smart Asset & Equipment Lifecycle Management Platform

An enterprise-ready Asset Lifecycle & Project Equipment Allocation system designed for high-concurrency environments, featuring a strict Finite State Machine (FSM), real-time project allocations, Day-by-Day deadline/expiration tracking, and a modern White & Orange interface.

---

## 🌟 Key Highlights & Features

1. **Strict Finite State Machine (FSM)**:
   - Eliminates invalid equipment state transitions (e.g. `available` ⇄ `in-use`, `in-use` ⇄ `maintenance`, `decommissioned`).
   - Prevents double-allocation across concurrent project requests using atomic MongoDB transactions.

2. **Free Equipment Pool & Dynamic Project Allocation**:
   - Assets not allocated to any project remain in the global Free Pool.
   - Project managers can seamlessly assign assets from the Free Pool to active projects or release them back upon milestone completion.

3. **Day-by-Day Expiry & Deadline Tracking**:
   - Dynamic countdown calculation displaying active validity, urgent alerts (≤ 10 days, ≤ 30 days), and overdue status for warranty, calibration, and lease contracts.
   - Built-in filter to spot immediate equipment renewals and operational risks.

4. **Role-Based Access Control (RBAC)**:
   - **Admin**: Full system management, asset type definitions, user roles, and global audit oversight.
   - **Project Manager**: Project creation, asset allocation/deallocation from free pool, deadline management.
   - **Field Engineer**: Asset status toggling (reporting maintenance or operational defects).
   - **Auditor**: Read-only compliance verification and audit history tracking.

5. **Modern White & Orange Theme**:
   - Clean, high-contrast, modern UI built with React + Vite and polished styling.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 18, Vite, React Router 6, Lucide Icons, Modern CSS Design System (White & Orange)
- **Backend**: Node.js, Express.js (ES Modules), Pino Logger, Custom Error Handling Middleware
- **Database**: MongoDB with Mongoose ODM (Atomic Transactions, Compound Indexing, Audit Logging)
- **DevOps & Containers**: Docker Compose, Nginx reverse proxy configuration

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) running locally on `localhost:27017` (or MongoDB Atlas URI)

---

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure environment variables
# Check .env or copy from .env.example
# PORT=5001
# MONGO_URI=mongodb://localhost:27017/asset_platform

# Start development server
npm run dev
```
Backend API will be running at: `http://localhost:5001`

---

### 3. Frontend Setup

```bash
# Navigate to frontend (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend will be accessible at: `http://localhost:5173`

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/assets` | List all assets with search, status, and deadline filtering |
| `POST` | `/api/v1/assets` | Register a new asset into the global free pool |
| `GET` | `/api/v1/assets/:id` | Get asset details, timeline history, and active project |
| `POST` | `/api/v1/assets/:id/status` | Transition asset status through the FSM engine |
| `GET` | `/api/v1/projects` | List all ongoing and completed projects |
| `POST` | `/api/v1/projects` | Create a new project |
| `POST` | `/api/v1/projects/:id/allocate` | Allocate asset from free pool to project |
| `POST` | `/api/v1/projects/:id/deallocate` | Release asset back to free pool |
| `GET` | `/api/v1/asset-types` | List asset categories and technical specifications |

---

## 👥 Authors & Acknowledgments

Developed by **Karmit Langhnoda** for the Pravi Hackathon.