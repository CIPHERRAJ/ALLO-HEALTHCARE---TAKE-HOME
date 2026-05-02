import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });

    return NextResponse.json({ 
      adminExists: adminCount > 0 
    });
  } catch (error) {
    console.error('ADMIN_STATUS_CHECK_ERROR:', error);
    return NextResponse.json({ adminExists: false }); 
  }
}
