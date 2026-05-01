import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const updatedReservation = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        throw new Error('RESERVATION_NOT_FOUND');
      }

      if (reservation.status === 'RELEASED') {
        return reservation;
      }

      if (reservation.status === 'CONFIRMED') {
        throw new Error('RESERVATION_ALREADY_CONFIRMED');
      }

      // 1. Release the hold
      await tx.stock.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: {
          reservedUnits: { decrement: reservation.units },
        },
      });

      // 2. Update reservation status
      return await tx.reservation.update({
        where: { id },
        data: { status: 'RELEASED' },
      });
    });

    return NextResponse.json(updatedReservation);
  } catch (error: any) {
    if (error.message === 'RESERVATION_NOT_FOUND') {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }
    if (error.message === 'RESERVATION_ALREADY_CONFIRMED') {
      return NextResponse.json({ error: 'Cannot release a confirmed reservation' }, { status: 400 });
    }

    console.error('Release error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
