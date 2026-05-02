import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { name, description, price, stocks } = await req.json();

    // Use a transaction to update product and its stocks
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // 1. Update product basic info
      const product = await tx.product.update({
        where: { id },
        data: {
          name,
          description,
          price: price !== undefined ? parseFloat(price) : undefined,
        },
      });

      // 2. Update stocks if provided
      if (stocks && Array.isArray(stocks)) {
        for (const s of stocks) {
          await tx.stock.upsert({
            where: {
              productId_warehouseId: {
                productId: id,
                warehouseId: s.warehouseId,
              },
            },
            update: {
              totalUnits: parseInt(s.totalUnits),
            },
            create: {
              productId: id,
              warehouseId: s.warehouseId,
              totalUnits: parseInt(s.totalUnits),
              reservedUnits: 0,
            },
          });
        }
      }

      return product;
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error('PRODUCT_UPDATE_ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Delete product (Prisma should handle related records if cascade is on, 
    // but we'll do it manually to be safe if needed or let standard errors catch blocks)
    // Note: In our schema, we didn't explicitly set onDelete: Cascade for Stock and Reservation on Product
    // So we should clean them up.
    
    await prisma.$transaction([
      prisma.reservation.deleteMany({ where: { productId: id } }),
      prisma.stock.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('PRODUCT_DELETE_ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
