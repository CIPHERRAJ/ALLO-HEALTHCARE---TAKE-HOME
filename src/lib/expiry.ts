import prisma from './prisma';
import { redis, redisEnabled } from './redis';

let lastCleanup = 0;
const CLEANUP_INTERVAL = 30 * 1000; // 30 seconds

export async function cleanupExpiredReservations() {
  const now = Date.now();

  // 1. Rate-limit the cleanup to avoid hammering the DB on every request
  if (redisEnabled) {
    const lock = await redis.get('cleanup_lock');
    if (lock) return;
    await redis.set('cleanup_lock', 'true', { ex: 30 }); // Lock for 30 seconds
  } else {
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;
  }

  try {
    const now_date = new Date();

    // 2. Find all pending reservations that have expired
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: now_date,
        },
      },
      take: 20, // Process more in one go
    });

    if (expiredReservations.length === 0) return;

    console.log(`Cleaning up ${expiredReservations.length} expired reservations in a single batch...`);

    // 3. Process ALL in a single transaction to be kind to the connection pool
    await prisma.$transaction(async (tx) => {
      for (const r of expiredReservations) {
        // Double-check status inside transaction
        const current = await tx.reservation.findUnique({
          where: { id: r.id },
          select: { status: true, productId: true, warehouseId: true, units: true }
        });

        if (current && current.status === 'PENDING') {
          // Return stock
          await tx.stock.update({
            where: {
              productId_warehouseId: {
                productId: current.productId,
                warehouseId: current.warehouseId,
              },
            },
            data: {
              reservedUnits: { decrement: current.units },
            },
          });

          // Mark as released
          await tx.reservation.update({
            where: { id: r.id },
            data: { status: 'RELEASED' },
          });

          // 4. Mark notification requests as processed (item is now potentially available)
          await tx.notificationRequest.updateMany({
            where: {
              productId: current.productId,
              warehouseId: current.warehouseId,
              processed: false,
            },
            data: {
              processed: true,
            },
          });
        }
      }
    }, {
      timeout: 20000 // 20 seconds for the batch
    });
  } catch (error) {
    console.error('Batch cleanup failed:', error);
    // If it failed, reset the local timer so the next request can try again
    if (!redisEnabled) lastCleanup = 0;
  }
}
