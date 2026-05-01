# Allo Inventory & Reservation System

This is a Next.js application built for the Allo Engineering Take-Home Exercise. It manages product inventory across multiple warehouses and handles race-condition-free reservations.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **Cache/Locking**: Upstash Redis (Idempotency)
- **Validation**: Zod
- **UI**: Tailwind CSS + shadcn/ui + Sonner

## Features

1. **Race-Condition-Free Reservations**: Uses Postgres Row-Level Locking (`SELECT ... FOR UPDATE`) within Prisma transactions to guarantee that stock is never over-reserved.
2. **Idempotency**: Implemented for both Reservation and Confirmation endpoints using an `Idempotency-Key` header and Redis.
3. **Live Countdown**: A real-time countdown on the checkout page shows when a reservation will expire.
4. **Automated Expiry**: Reservations are automatically released if not confirmed within 10 minutes.
5. **Responsive UI**: Built with shadcn/ui and Tailwind for a modern look.

## How to Run Locally

Since this app uses SQLite for local development, you don't need to install any database or Docker.

### 1. Prerequisites
- Node.js 20+

### 2. Environment Variables
Create a `.env` file in the root directory (optional for local dev as SQLite is the default):

```env
# Optional: Only needed for production or if you want to use Redis locally
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seeding
```bash
# This creates a local dev.db file and the tables
npx prisma migrate dev --name init
# This populates the local database with products and stock
npx prisma db seed
```

### 5. Run the App
```bash
npm run dev
```

## Moving to Production (PostgreSQL)

To deploy with a real PostgreSQL database (like Neon or Supabase):

1.  **Update `prisma/schema.prisma`**:
    Change the `datasource` block back to:
    ```prisma
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    ```
2.  **Update Raw Queries**: The code in `src/app/api/reservations/route.ts` already handles the switch between SQLite and Postgres syntax.
3.  **Deploy**: Set the `DATABASE_URL` and Upstash Redis variables in your hosting provider (e.g., Vercel).
