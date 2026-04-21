# 🚚 SupplySync: B2B Industrial Order Allocation Platform

> **A real-time geospatial order allocation and logistics management platform built for modern industrial supply chains.**

SupplySync is designed to solve a critical problem in B2B manufacturing: securing urgent spare parts rapidly. By mapping buyer locations against active supplier inventories and calculating live routing algorithms, SupplySync reduces equipment downtime and automates backend SLA tracking.

---

## ✨ Core Features

*   **Geospatial Supplier Matching Algorithm:** Automatically routes orders to the nearest optimized supplier using PostGIS spatial calculations based on inventory levels, historical reliability, and geographic proximity.
*   **Live WebSocket Telemetry:** Tracks driver locations in real-time, simulating live map-based courier feeds via Mapbox GL JS on a robust WebSocket architecture.
*   **AI-Powered Insights:** Leverages Anthropic's Claude API to detect anomalies in supply flows and automatically generate plain-English mitigation plans for operators.
*   **Role-Based Portals:**
    *   **Buyer Dashboard:** Request urgent parts, view match scores, and track inbound deliveries.
    *   **Supplier Dashboard:** Inventory management, order fulfillment queue, and performance history.
    *   **Admin Control Room:** "God View" global map monitoring all active deliveries and AI-driven SLA metrics.

---

## 🛠️ Technology Stack

| Focus | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | Node.js, Express, TypeScript, REST API, WebSockets (ws), JWT Authentication |
| **Database** | PostgreSQL, PostGIS, Prisma ORM, Redis (Tracking Cache) |
| **Integrations** | Mapbox GL JS (Mapping), Claude API (AI Analytics), Recharts (Data Visualization) |

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Frontend "Frontend (Next.js + Tailwind + Mapbox)"
        BuyerUI[Buyer Portal]
        SupplierUI[Supplier Dashboard]
        AdminUI[Admin Dashboard]
    end

    subgraph Backend "Backend (Node.js + Express)"
        API[REST API Layer]
        WSS[WebSocket Server]
        Matcher[Supplier Matching Engine]
        AIService[AI Analytics Service]
    end

    subgraph Persistence "Persistence Layer"
        PG[(PostgreSQL + PostGIS)]
        Redis[(Redis Cache)]
    end

    BuyerUI <--> |REST / JWT| API
    SupplierUI <--> |REST / JWT| API
    AdminUI <--> |REST / JWT| API
    BuyerUI <--> |WebSocket| WSS
    AdminUI <--> |WebSocket| WSS

    API --> Matcher
    API --> AIService
    API <--> PG
    WSS <--> Redis
```

---

## 🚀 Getting Started

### Prerequisites

*   Node.js v18+
*   PostgreSQL with the PostGIS extension installed
*   Mapbox API Token (Free tier)
*   Claude API Key (optional, for AI features)

### 1. Database Setup

1. Configure your PostgreSQL database URL in `backend/.env`.
2. Run database migrations to establish the schema and spatial columns:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   ```

### 2. Running the Backend

The Express server handles API requests, PostGIS queries, and WebSocket tracking channels.

```bash
cd backend
npm run dev
# Server will run on http://localhost:8080
```

### 3. Running the Frontend

The UI runs on Next.js 14 utilizing the new App router.

```bash
cd frontend
npm install
npm run dev
# Client will run on http://localhost:3000
```

*Note: Be sure to paste your Mapbox access token into the respective `page.tsx` elements or configure it in `.env.local` to enable mapping functionality.*

---

## 🗺️ Demonstration Data

To properly test the matching engine, you can use the predefined route parameters simulated in the frontend:
- **Default Test User**: Log in with `admin@test.com` or `supplier@test.com` to explore the role based redirections.
- **Urgency Vectors**: Test the Order flow selecting **P1 (Critical)** vs **P3 (Standard)** to observe how the AI scoring system dynamically rewrites the match priority in the UI.

---

*Designed and Developed for Final Year Engineering Project.*
