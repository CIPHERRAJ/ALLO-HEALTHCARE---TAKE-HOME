import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cleanupExpiredReservations } from '@/lib/expiry';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Trigger lazy cleanup (non-blocking for performance)
    cleanupExpiredReservations().catch(e => console.error('Lazy cleanup failed:', e));

    const products = await prisma.product.findMany({
      include: {
        stocks: {
          include: {
            warehouse: true,
          },
        },
        reservations: {
          where: {
            status: 'PENDING',
            expiresAt: { gt: new Date() }
          },
          orderBy: { expiresAt: 'asc' }
        }
      },
    });

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      stocks: product.stocks.map((stock) => {
        // Find the earliest expiry for this specific warehouse
        const warehouseReservations = product.reservations.filter(
          r => r.warehouseId === stock.warehouseId
        );
        const earliestExpiry = warehouseReservations.length > 0 
          ? warehouseReservations[0].expiresAt 
          : null;

        return {
          warehouseId: stock.warehouseId,
          warehouseName: stock.warehouse.name,
          totalUnits: stock.totalUnits,
          reservedUnits: stock.reservedUnits,
          availableUnits: Math.max(0, stock.totalUnits - stock.reservedUnits),
          earliestExpiry,
        };
      }),
    }));

    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    console.error('DATABASE_ERROR_LOG:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message,
      code: error.code 
    }, { status: 500 });
  }
}
