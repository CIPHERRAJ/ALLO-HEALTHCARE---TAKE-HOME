# Allo Inventory & Reservation System

This is a Next.js application built for the Allo Engineering Take-Home Exercise. It manages product inventory across multiple warehouses and handles race-condition-free reservations using a sophisticated **Atomic Batch Protocol**.

## 🚀 Live Demo
**URL**: [https://allo-healthcare-take-home-41n8.vercel.app/](https://allo-healthcare-take-home-41n8.vercel.app/)

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (End-to-End)
- **Database**: PostgreSQL (Prisma ORM) - Hosted on Supabase
- **Cache/Idempotency**: Upstash Redis
- **Validation**: Zod (Shared schemas)
- **UI**: Tailwind CSS + shadcn/ui + Sonner

---

## 🏗 Core Architecture

### 1. Atomic Batch Reservations
Unlike simple reservation systems, this platform implements an **Atomic Batch Protocol**. Users can add multiple items from different warehouses to their cart and reserve them all in a single action.

- **Transaction Integrity**: The system uses a single Prisma transaction for the entire batch. If even one item is out of stock, the entire reservation rolls back, preventing partial or inconsistent orders.
- **Deadlock Protection**: To prevent system-wide freezes under high load, the backend sorts all requested inventory rows by ID before acquiring locks. This ensures a consistent locking order across all concurrent requests.

### 2. Concurrency & Locking
The core reservation logic uses **Pessimistic Locking** (`SELECT ... FOR UPDATE`) to guarantee absolute correctness:
1.  A transaction is started.
2.  The stock rows are locked in a deterministic order.
3.  Available units are verified against the request.
4.  Reserved units are incremented and records are created.
5.  Lock is released upon commit.

This ensures that if two customers try to grab the last mechanical keyboard at the same millisecond, exactly one will succeed (201 Created) and the other will receive a clear error (409 Conflict).

### 3. Idempotency (Bonus Feature)
Every reservation and confirmation request is protected against network retries:
- **Redis Cache**: Successful responses are cached in Upstash Redis by `Idempotency-Key`.
- **Database Unique Constraint**: A unique constraint on the `idempotencyKey` field in the `Reservation` model acts as a final safety net.
- **Stable Keys**: The frontend generates a stable key per action attempt, ensuring that retrying a "Confirm Purchase" click doesn't result in double-billing or multiple stock decrements.

---

## ⏱ Reservation Expiry

The system implements a **Lazy Cleanup on Read** strategy:
- **Trigger**: Every time a user views the product list or their activity log, the server triggers a non-blocking cleanup.
- **Mechanism**: The `cleanupExpiredReservations` function finds `PENDING` holds past their `expiresAt` and returns their units to the available pool in a batched transaction.
- **Transparency**: Users see a "On Hold" status and a "Next Release" countdown in the UI, providing real-time feedback on when units might become available again.

---

## 🔐 Admin & Authentication

### User Roles
- **USER**: Can browse inventory, add to cart, and manage their reservations.
- **ADMIN**: Has access to the **Admin Console** (`/admin`) to manage the global catalog and stock levels.

### Setup Admin Access
1. Register a user at `/register`.
2. To become an admin, provide the `ADMIN_SECRET` (configured in your environment) in the optional "Admin Secret" field on the registration form.

---

## 🚀 How to Run Locally

### 1. Environment Variables
Create a `.env` file:
```env
# Database (Supabase/Postgres)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth
AUTH_SECRET="your-random-secret"
ADMIN_SECRET="AlloAdmin2026"

# Redis (Idempotency)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### 2. Setup
```bash
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 3. Start
```bash
npm run dev
```

---

## 📐 Trade-offs & Considerations

1.  **Row-Level vs. Distributed Locking**: I chose Postgres `FOR UPDATE` locking for its absolute consistency and simplicity in a relational model. For extreme scale, a Redis-based lock could be faster but adds "split-brain" risks.
2.  **Lazy Cleanup**: Ideal for a prototype as it requires no extra infrastructure (like cron jobs). In production, I would supplement this with a **Vercel Cron** to ensure inventory is released even during low-traffic periods.
3.  **Atomic Batches**: While more complex to implement than single-item holds, it provides a much better "Cart to Checkout" experience and avoids the user having to manage multiple individual timers.
