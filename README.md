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
## Idempotency Implementation (Bonus)

Idempotency is implemented for the `POST /api/reservations` and `POST /api/reservations/:id/confirm` endpoints:

1.  **Client-Side**: The client generates a unique UUID and sends it in the `Idempotency-Key` header.
2.  **Server-Side (Cache)**: The server checks if this key exists in **Upstash Redis**. If it does, it returns the cached response immediately.
3.  **Server-Side (Database)**: As a secondary safety net, the `Reservation` model has a `unique` constraint on the `idempotencyKey` field in the database.
4.  **Transaction**: If the request is new, it proceeds with the transaction. Once successful, the result is cached in Redis with a 1-hour TTL.

This ensures that if a network timeout occurs and the client retries, the server won't decrement stock twice or create duplicate reservations.
4. **Admin Dashboard**: A secure interface for managing products, setting prices, and allocating stock levels across warehouses.
5. **Role-Based Access Control (RBAC)**: Users are categorized as `USER` or `ADMIN`, with the latter having exclusive access to the management console.
6. **Soft Hold Transparency**: The system distinguishes between "Sold Out" and "Temporarily Held" units, providing "Next Release" countdowns to improve conversion.
7. **Responsive UI**: Built with shadcn/ui and Tailwind for a modern look.

## Admin Dashboard & Setup

The application now includes an **Admin Console** at `/admin`.

### 1. Promoting a User to Admin
To create an admin account:
1. Set an `ADMIN_SECRET` in your `.env` file.
2. During registration (`/register`), include the `adminSecret` in the request body (via API) or use the updated registration form.
3. Once logged in as an ADMIN, an "Admin Console" link will appear in the main navigation bar.

### 2. Capabilities
- **Create Products**: Set product name, price, and description.
- **Stock Management**: Allocate initial stock units to any active warehouse in the network.
- **Price Tracking**: All products now have a `price` field which is tracked through the reservation and checkout lifecycle.

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
    Ensure the `datasource` block uses `postgresql`:
    ```prisma
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
      directUrl = env("DIRECT_URL")
    }
    ```
2.  **Update Raw Queries**: The code in `src/app/api/reservations/route.ts` already handles the switch between SQLite and Postgres syntax.
3.  **Deploy**: Set the `DATABASE_URL`, `DIRECT_URL`, and Upstash Redis variables in your hosting provider (e.g., Vercel).

## Reservation Expiry Mechanism

The system implements a **Lazy Cleanup on Read** strategy for handling expired reservations:

- Whenever a user fetches the product list (`GET /api/products`) or checks a specific reservation (`GET /api/reservations/:id`), the server triggers a cleanup process.
- The `cleanupExpiredReservations` function identifies all `PENDING` reservations whose `expiresAt` time has passed.
- It then executes a transaction for each expired reservation to decrement the `reservedUnits` in the corresponding `Stock` record and mark the reservation as `RELEASED`.

**Why Lazy Cleanup?**
- It avoids the complexity of setting up a separate background worker or cron job for a prototype.
- It ensures that users always see accurate availability because the stock is released just before they view the product list.

**Production Recommendation:**
For a high-volume production environment, I would supplement this with a **Vercel Cron Job** (hitting an endpoint every 1 minute) to ensure stock is released even if there's no traffic.

## Concurrency Handling

The core of the reservation system uses **Pessimistic Locking** to prevent race conditions:

1.  A transaction is started.
2.  The stock row is locked using `SELECT ... FOR UPDATE` (Postgres).
3.  The server checks if `availableUnits (total - reserved) >= requestedUnits`.
4.  If valid, `reservedUnits` is incremented and the reservation is created.
5.  The transaction is committed, releasing the lock.

This ensures that if two requests for the last unit arrive at the exact same millisecond, the first one will acquire the lock, and the second one will wait until the first is done, then see that stock is 0 and receive a `409 Conflict`.

## Trade-offs & Future Improvements

1.  **Lazy Cleanup vs. Cron**: Lazy cleanup is efficient for low traffic but might cause a slight delay in stock availability if the site has no visitors. A cron job is more robust.
2.  **Redis for Locking**: While I used Postgres row-level locking, for extreme scale (millions of RPS), using Redis (Redlock) for the initial reservation attempt could reduce database load, though it introduces consistency challenges.
3.  **Soft Deletes**: Currently, reservations are updated to `RELEASED`. In a real system, I might move them to an archive table to keep the active table small.
4.  **Unit Selection**: Currently, the system assumes 1 unit per reservation for simplicity in the UI, but the API supports arbitrary units.
5.  **Inventory Sourcing**: The current implementation doesn't include an algorithm to pick the "best" warehouse (e.g., closest to user). It requires the client to specify a `warehouseId`.
