import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { redis, redisEnabled } from '@/lib/redis';

const reservationSchema = z.object({
  productId: z.string(),
  warehouseId: z.string(),
  units: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get('Idempotency-Key');
  
  try {
    const body = await req.json();
    const { productId, warehouseId, units } = reservationSchema.parse(body);

    // Idempotency check
    if (idempotencyKey && redisEnabled) {
      const cachedResponse = await redis.get(`idempotency:reserve:${idempotencyKey}`);
      if (cachedResponse) {
        return NextResponse.json(cachedResponse);
      }
    }

    const reservation = await prisma.$transaction(async (tx) => {
      // 1. Lock the stock row and check availability
      // Note: SQLite doesn't support FOR UPDATE. In SQLite, the $transaction with default isolation
      // handles the lock when the first write occurs. For production Postgres, FOR UPDATE is better.
      const isSqlite = (prisma as any)._activeProvider === 'sqlite';
      const stocks = await tx.$queryRawUnsafe<any[]>(
        isSqlite 
          ? `SELECT * FROM "Stock" WHERE "productId" = ? AND "warehouseId" = ?`
          : `SELECT * FROM "Stock" WHERE "productId" = $1 AND "warehouseId" = $2 FOR UPDATE`,
        productId,
        warehouseId
      );

      if (stocks.length === 0) {
        throw new Error('STOCK_NOT_FOUND');
      }

      const stock = stocks[0];
      const availableUnits = stock.totalUnits - stock.reservedUnits;

      if (availableUnits < units) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      // 2. Increment reserved units
      await tx.stock.update({
        where: {
          productId_warehouseId: { productId, warehouseId },
        },
        data: {
          reservedUnits: { increment: units },
        },
      });

      // 3. Create reservation
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      return await tx.reservation.create({
        data: {
          productId,
          warehouseId,
          units,
          expiresAt,
          status: 'PENDING',
          idempotencyKey,
        },
      });
    });

    if (idempotencyKey && redisEnabled) {
      await redis.set(`idempotency:reserve:${idempotencyKey}`, reservation, { ex: 3600 });
    }

    return NextResponse.json(reservation, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    if (error.message === 'INSUFFICIENT_STOCK') {
      return NextResponse.json({ error: 'Not enough stock available' }, { status: 409 });
    }
    if (error.message === 'STOCK_NOT_FOUND') {
      return NextResponse.json({ error: 'Stock record not found' }, { status: 404 });
    }
    
    // Handle unique constraint violation for idempotencyKey if redis check failed/raced
    if (error.code === 'P2002') {
        const existing = await prisma.reservation.findUnique({
            where: { idempotencyKey: idempotencyKey! }
        });
        return NextResponse.json(existing);
    }

    console.error('Reservation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
