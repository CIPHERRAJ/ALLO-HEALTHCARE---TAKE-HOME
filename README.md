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
2. **Google Authentication**: Integrated with NextAuth.js (Auth.js) to secure the reservation process. Users must be logged in to hold items.
3. **Idempotency**: Implemented for both Reservation and Confirmation endpoints using an `Idempotency-Key` header and Redis.
4. **Live Countdown**: A real-time countdown on the checkout page shows when a reservation will expire.
5. **Automated Expiry**: Reservations are automatically released if not confirmed within 10 minutes.
6. **Responsive UI**: Built with shadcn/ui and Tailwind for a modern look.

## How to Run Locally

Since this app uses SQLite for local development, you don't need to install any database or Docker.

### 1. Prerequisites
- Node.js 20+

### 2. Environment Variables
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth (Authentication)
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Optional: Redis for Idempotency
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seeding
```bash
# This creates a local dev.db file and the tables (including Auth models)
npx prisma migrate dev --name init
# This populates the local database with products and stock
npx prisma db seed
```

### 5. Run the App
```bash
npm run dev
```

## Authentication Setup (Google OAuth)

To enable Google Login:
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project.
3.  Go to **APIs & Services > Credentials**.
4.  Create an **OAuth 2.0 Client ID**.
5.  Add `http://localhost:3000/api/auth/callback/google` to the **Authorized redirect URIs**.
6.  Copy the Client ID and Client Secret into your `.env` file.

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
