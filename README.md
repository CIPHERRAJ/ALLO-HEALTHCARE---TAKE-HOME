# Allo Inventory & Reservation System

A high-performance Next.js application designed for the Allo Engineering Take-Home Exercise. It manages product inventory across multiple warehouses with a focus on real-time synchronization, race-condition-free reservations, and proactive user notifications.

## 🚀 Live Demo
**URL**: [https://allo-healthcare-take-home-41n8.vercel.app/](https://allo-healthcare-take-home-41n8.vercel.app/)

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (End-to-End Type Safety)
- **Database**: PostgreSQL (Prisma ORM) - Hosted on Supabase
- **Cache/Idempotency**: Upstash Redis
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons & Notifications**: Lucide React + Sonner

---

## 🏗 Core Project Features

### 1. Atomic Batch Protocol
Unlike simple reservation systems, this platform handles **Atomic Batch Reservations**. Users can add multiple items from different warehouses to their fulfillment queue and secure them all in a single transaction.
- **Transactional Integrity**: Uses a single Prisma transaction for the entire batch. If one item becomes unavailable, the entire request rolls back to prevent partial, inconsistent orders.
- **Automatic Queue Management**: The fulfillment queue opens automatically upon the first reservation attempt, ensuring a seamless "one-click" transition from catalog to checkout.

### 2. Intelligent Real-time Synchronization
The system is built to keep the UI "live" without manual refreshes:
- **Auto-Refresh on Expiry**: When a 10-minute reservation hold expires, the system automatically detects the `00:00` state and triggers a background refresh to return units to the "Reserve" pool instantly.
- **Inventory Waitlist (Notify)**: Users can join a waitlist for out-of-stock items. The system polls for availability every 10 seconds and pushes a notification to the user the moment stock is released.

### 3. Concurrency & Locking Strategy
The backend uses **Pessimistic Locking** (`SELECT ... FOR UPDATE`) to guarantee absolute correctness during high-traffic bursts:
- **Deadlock Protection**: Requested inventory rows are sorted by ID before acquiring locks, ensuring a consistent locking order across all concurrent requests.
- **Race Condition Prevention**: If two users attempt to reserve the last unit at the same millisecond, the database level lock ensures exactly one succeeds with a `201 Created` while the other receives a clean `409 Conflict`.

### 4. Enterprise-Grade Idempotency
- **Deduplication**: Every reservation is protected against network retries using an `Idempotency-Key` stored in Redis.
- **Stable Actions**: Frontend-generated stable keys ensure that "Confirm Purchase" or "Authorize Hold" actions are never executed twice, even if the user clicks multiple times or the network drops.

---

## ⏱ Automated Inventory Recovery

The system implements a **Blocking Cleanup on Read** strategy to ensure data freshness:
- **Blocking Sync**: Unlike lazy cleanup, our API `awaits` the reservation cleanup process. This ensures that when a user fetches the catalog, they *never* see units that have technically expired but haven't been released yet.
- **Batch Processing**: The cleanup engine processes up to 100 expired reservations in a single transaction to maintain high performance under heavy load.

---

## 🔐 Authorization & Roles

- **OPERATOR**: Browse global inventory, manage fulfillment queues, and secure allocation holds.
- **ADMINISTRATOR**: Access the **Admin Terminal** (`/admin`) to manage the global catalog, update warehouse stock levels, and audit trail.

---

## 🚀 Local Development

### 1. Environment Configuration
Create a `.env` file with the following keys:
```env
DATABASE_URL="postgresql://..." # Postgres connection string
DIRECT_URL="postgresql://..."   # Direct Postgres connection

AUTH_SECRET="your-secret"       # NextAuth secret
ADMIN_SECRET="AlloAdmin2026"    # Secret for admin registration

UPSTASH_REDIS_REST_URL="..."    # Redis for idempotency
UPSTASH_REDIS_REST_TOKEN="..."
```

### 2. Quick Start
```bash
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

---

## 📐 Project Design Decisions

1.  **Postgres Row-Level Locking**: Chosen over distributed locks for its native consistency guarantees within transactions, which is critical for inventory integrity.
2.  **High-Frequency Polling (10s)**: Selected to provide a "live" feel for notifications without the complexity of WebSockets, optimized by caching and lightweight endpoint design.
3.  **App Router & Server Actions**: Leveraged Next.js 15 features for optimal performance and SEO-friendly initial loads.
