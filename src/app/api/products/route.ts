import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cleanupExpiredReservations } from '@/lib/expiry';
import { auth } from '@/auth';

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
      price: product.price,
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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  try {
    const { name, description, price, stocks } = await req.json();

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stocks: {
          create: stocks?.map((s: any) => ({
            warehouseId: s.warehouseId,
            totalUnits: parseInt(s.totalUnits),
          })) || [],
        },
      },
      include: {
        stocks: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('ADMIN_PRODUCT_CREATE_ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
