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

    console.log('NOTIFY_SUBSCRIBE_START', { 
      userId: (session.user as any).id, 
      productId, 
      warehouseId 
    });

    const request = await (prisma as any).notificationRequest.upsert({
      where: {
        userId_productId_warehouseId: {
          userId: (session.user as any).id,
          productId,
          warehouseId,
        },
      },
      update: {
        processed: false,
        notified: false,
        createdAt: new Date(),
      },
      create: {
        userId: (session.user as any).id,
        productId,
        warehouseId,
      },
    });

    console.log('NOTIFY_SUBSCRIBE_SUCCESS', { requestId: request.id });
    return NextResponse.json({ message: 'Subscribed to availability notifications', request });
  } catch (error: any) {
    console.error('NOTIFICATION_SUBSCRIBE_ERROR:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}
