import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { redis, redisEnabled } from '@/lib/redis';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idempotencyKey = req.headers.get('Idempotency-Key');

  try {
    // Idempotency check
    if (idempotencyKey && redisEnabled) {
      const cachedResponse = await redis.get(`idempotency:confirm:${idempotencyKey}`);
      if (cachedResponse) {
        return NextResponse.json(cachedResponse);
      }
    }

    const updatedReservation = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        throw new Error('RESERVATION_NOT_FOUND');
      }

      if (reservation.status === 'CONFIRMED') {
        return reservation;
      }

      if (reservation.status === 'RELEASED') {
        throw new Error('RESERVATION_ALREADY_RELEASED');
      }

      if (reservation.expiresAt < new Date()) {
        throw new Error('RESERVATION_EXPIRED');
      }

      // 1. Permanently decrement stock
      await tx.stock.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: {
          totalUnits: { decrement: reservation.units },
          reservedUnits: { decrement: reservation.units },
        },
      });

      // 2. Update reservation status
      return await tx.reservation.update({
        where: { id },
        data: { status: 'CONFIRMED' },
      });
    }, {
      timeout: 15000 // 15 seconds
    });

    if (idempotencyKey && redisEnabled) {
      await redis.set(`idempotency:confirm:${idempotencyKey}`, updatedReservation, { ex: 3600 });
    }

    return NextResponse.json(updatedReservation);
  } catch (error: any) {
    if (error.message === 'RESERVATION_NOT_FOUND') {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }
    if (error.message === 'RESERVATION_EXPIRED') {
      return NextResponse.json({ error: 'Reservation has expired' }, { status: 410 });
    }
    if (error.message === 'RESERVATION_ALREADY_RELEASED') {
      return NextResponse.json({ error: 'Reservation was already released' }, { status: 400 });
    }

    console.error('Confirmation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
