import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('EMERGENCY_RESET_STARTED');
    
    // 1. Force verify connection
    await prisma.$connect();
    console.log('DATABASE_CONNECTION_VERIFIED');

    // 2. Create/Update Admin User
    const adminEmail = 'admin@allo.com';
    const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
    
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: adminPassword,
        role: 'ADMIN',
      },
      create: {
        name: 'System Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'ADMIN',
      },
    });

    console.log('EMERGENCY_RESET_SUCCESS', { id: user.id });

    return NextResponse.json({
      status: 'success',
      message: 'Admin credentials have been restored.',
      details: {
        email: adminEmail,
        password: 'AdminPassword123!',
        userId: user.id
      }
    });
  } catch (error: any) {
    console.error('EMERGENCY_RESET_FAILED', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed.',
      error: error.message,
      code: error.code
    }, { status: 500 });
  } finally {
    // Crucial: Disconnect to release the slot for the login attempt
    await prisma.$disconnect();
  }
}
