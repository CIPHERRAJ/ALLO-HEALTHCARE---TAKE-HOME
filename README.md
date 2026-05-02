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
2. **Custom Authentication**: Integrated with NextAuth.js (Auth.js) using Email & Password. Users can register and login to secure the reservation process.
3. **Idempotency**: Implemented for both Reservation and Confirmation endpoints using an `Idempotency-Key` header and Redis.
4. **Live Countdown**: A real-time countdown on the checkout page shows when a reservation will expire.
5. **Automated Expiry**: Reservations are automatically released if not confirmed within 10 minutes.
6. **Responsive UI**: Built with shadcn/ui and Tailwind for a modern look.

## How to Run Locally

### 1. Prerequisites
- Node.js 20+

### 2. Environment Variables
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="your-database-url"

# NextAuth (Authentication)
AUTH_SECRET="your-secret-here"

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
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Run the App
```bash
npm run dev
```

## Authentication Setup (Email/Password)

The application uses custom email and password authentication.

1.  **Registration**: New users can create an account at `/register`.
2.  **Login**: Users can sign in at `/login`.
3.  **Security**: Passwords are hashed using `bcryptjs` before being stored in the database.


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
