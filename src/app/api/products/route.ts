import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cleanupExpiredReservations } from '@/lib/expiry';

export async function GET() {
  try {
    // Lazy cleanup of expired reservations
    try {
      await cleanupExpiredReservations();
    } catch (e) {
      console.error('Lazy cleanup failed:', e);
    }

    const products = await prisma.product.findMany({
      include: {
        stocks: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      stocks: product.stocks.map((stock) => ({
        warehouseId: stock.warehouseId,
        warehouseName: stock.warehouse.name,
        totalUnits: stock.totalUnits,
        reservedUnits: stock.reservedUnits,
        availableUnits: stock.totalUnits - stock.reservedUnits,
      })),
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
