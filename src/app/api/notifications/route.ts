import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('NOTIFICATIONS_CHECK_START', { userId: (session.user as any).id });
    
    const notifications = await (prisma as any).notificationRequest.findMany({
      where: {
        userId: (session.user as any).id,
        processed: true,
        notified: false,
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    // Mark as notified so they don't pop up again
    if (notifications.length > 0) {
      console.log('NOTIFICATIONS_FOUND', { count: notifications.length });
      await (prisma as any).notificationRequest.updateMany({
        where: {
          id: { in: notifications.map((n: any) => n.id) },
        },
        data: {
          notified: true,
        },
      });
    }

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error('NOTIFICATIONS_FETCH_ERROR:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
