import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { redis, redisEnabled } from '@/lib/redis';
import { auth } from '@/auth';
import { cleanupExpiredReservations } from '@/lib/expiry';

const reservationItemSchema = z.object({
  productId: z.string(),
  warehouseId: z.string(),
  units: z.number().int().positive(),
});

const reservationSchema = z.union([
  reservationItemSchema,
  z.array(reservationItemSchema)
]);

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Trigger lazy cleanup (non-blocking)
    cleanupExpiredReservations().catch(e => console.error('Background cleanup failed in GET list:', e));

    const reservations = await prisma.reservation.findMany({
      where: {
        userId: (session.user as any).id,
      },
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(reservations);
  } catch (error: any) {
    console.error('USER_RESERVATIONS_ERROR:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message,
      code: error.code 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idempotencyKey = req.headers.get('Idempotency-Key');
  
  try {
    const body = await req.json();
    const parsed = reservationSchema.parse(body);
    const items = Array.isArray(parsed) ? parsed : [parsed];

    // Idempotency check
    if (idempotencyKey && redisEnabled) {
      const cachedResponse = await redis.get(`idempotency:reserve:${idempotencyKey}`);
      if (cachedResponse) {
        return NextResponse.json(cachedResponse);
      }
    }

    const results = await prisma.$transaction(async (tx) => {
      // 1. Sort items by productId + warehouseId to prevent deadlocks when locking multiple rows
      const sortedItems = [...items].sort((a, b) => 
        `${a.productId}-${a.warehouseId}`.localeCompare(`${b.productId}-${b.warehouseId}`)
      );

      const createdReservations = [];

      for (const item of sortedItems) {
        const { productId, warehouseId, units } = item;

        // 2. Lock the stock row and check availability
        const isSqlite = (prisma as any)._activeProvider === 'sqlite';
        const stocks = await tx.$queryRawUnsafe<any[]>(
          isSqlite 
            ? `SELECT * FROM "Stock" WHERE "productId" = ? AND "warehouseId" = ?`
            : `SELECT * FROM "Stock" WHERE "productId" = $1 AND "warehouseId" = $2 FOR UPDATE`,
          productId,
          warehouseId
        );

        if (stocks.length === 0) {
          throw new Error(`STOCK_NOT_FOUND:${productId}`);
        }

        const stock = stocks[0];
        const availableUnits = stock.totalUnits - stock.reservedUnits;

        if (availableUnits < units) {
          throw new Error(`INSUFFICIENT_STOCK:${productId}`);
        }

        // 3. Increment reserved units
        await tx.stock.update({
          where: {
            productId_warehouseId: { productId, warehouseId },
          },
          data: {
            reservedUnits: { increment: units },
          },
        });

        // 4. Create reservation
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        const res = await tx.reservation.create({
          data: {
            productId,
            warehouseId,
            userId: (session.user as any).id,
            units,
            expiresAt,
            status: 'PENDING',
            idempotencyKey: items.length === 1 ? idempotencyKey : `${idempotencyKey}:${productId}`, // Key per item for batches
          },
        });
        createdReservations.push(res);
      }

      return createdReservations;
    }, {
      timeout: 20000 // 20 seconds for potential batch processing
    });

    const finalResponse = items.length === 1 ? results[0] : results;

    if (idempotencyKey && redisEnabled) {
      await redis.set(`idempotency:reserve:${idempotencyKey}`, finalResponse, { ex: 3600 });
    }

    return NextResponse.json(finalResponse, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    if (error.message.startsWith('INSUFFICIENT_STOCK')) {
      return NextResponse.json({ error: 'Not enough stock available', item: error.message.split(':')[1] }, { status: 409 });
    }
    if (error.message.startsWith('STOCK_NOT_FOUND')) {
      return NextResponse.json({ error: 'Stock record not found', item: error.message.split(':')[1] }, { status: 404 });
    }
    
    // Handle unique constraint violation for idempotencyKey
    if (error.code === 'P2002' && idempotencyKey) {
        const existing = await prisma.reservation.findFirst({
            where: { idempotencyKey: { startsWith: idempotencyKey } }
        });
        return NextResponse.json(existing);
    }

    console.error('Reservation error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error.message,
      code: error.code 
    }, { status: 500 });
  }
}
