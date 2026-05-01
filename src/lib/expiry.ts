import prisma from './prisma';

export async function cleanupExpiredReservations() {
  const now = new Date();

  // Find all pending reservations that have expired
  const expiredReservations = await prisma.reservation.findMany({
    where: {
      status: 'PENDING',
      expiresAt: {
        lt: now,
      },
    },
  });

  if (expiredReservations.length === 0) return;

  console.log(`Cleaning up ${expiredReservations.length} expired reservations...`);

  // Process each in a transaction to ensure stock is returned correctly
  for (const reservation of expiredReservations) {
    try {
      await prisma.$transaction(async (tx) => {
        // Re-check status within transaction to avoid race conditions
        const r = await tx.reservation.findUnique({
          where: { id: reservation.id },
        });

        if (r && r.status === 'PENDING') {
          // 1. Return stock to available pool
          await tx.stock.update({
            where: {
              productId_warehouseId: {
                productId: r.productId,
                warehouseId: r.warehouseId,
              },
            },
            data: {
              reservedUnits: { decrement: r.units },
            },
          });

          // 2. Mark as released (or a new status EXPIRED if preferred, but RELEASED fits the schema)
          await tx.reservation.update({
            where: { id: r.id },
            data: { status: 'RELEASED' },
          });
        }
      });
    } catch (error) {
      console.error(`Failed to cleanup reservation ${reservation.id}:`, error);
    }
  }
}
