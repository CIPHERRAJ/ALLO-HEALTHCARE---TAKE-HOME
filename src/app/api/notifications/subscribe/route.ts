import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId, warehouseId } = await req.json();

    if (!productId || !warehouseId) {
      return NextResponse.json({ error: 'Product ID and Warehouse ID are required' }, { status: 400 });
    }

    const request = await prisma.notificationRequest.upsert({
      where: {
        userId_productId_warehouseId: {
          userId: (session.user as any).id,
          productId,
          warehouseId,
        },
      },
      update: {
        processed: false,
        createdAt: new Date(),
      },
      create: {
        userId: (session.user as any).id,
        productId,
        warehouseId,
      },
    });

    return NextResponse.json({ message: 'Subscribed to availability notifications', request });
  } catch (error: any) {
    console.error('NOTIFICATION_SUBSCRIBE_ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
