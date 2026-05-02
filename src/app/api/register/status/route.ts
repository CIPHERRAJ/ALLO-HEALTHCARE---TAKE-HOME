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
    return NextResponse.json({ adminExists: true }); // Default to true on error for safety
  }
}
