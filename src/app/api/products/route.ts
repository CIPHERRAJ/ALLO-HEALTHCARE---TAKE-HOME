import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cleanupExpiredReservations } from '@/lib/expiry';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

async function ensureBaseData() {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) return;

    console.log('INITIALIZING_DATABASE_BASE_DATA');
    
    // Create Admin
    const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
    await prisma.user.upsert({
      where: { email: 'admin@allo.com' },
      update: {},
      create: {
        name: 'System Administrator',
        email: 'admin@allo.com',
        password: adminPassword,
        role: 'ADMIN',
      },
    });

    // Create Warehouses
    const w1 = await prisma.warehouse.upsert({
      where: { id: 'cl-warehouse-1' },
      update: { name: 'Main Warehouse (London)' },
      create: { id: 'cl-warehouse-1', name: 'Main Warehouse (London)' },
    });
    const w2 = await prisma.warehouse.upsert({
      where: { id: 'cl-warehouse-2' },
      update: { name: 'East Coast Hub (New York)' },
      create: { id: 'cl-warehouse-2', name: 'East Coast Hub (New York)' },
    });

    // Create Products
    const products = [
      { id: 'prod-1', name: 'Mechanical Keyboard', price: 129.99, desc: 'Tactile, wireless, and RGB backlit.' },
      { id: 'prod-2', name: 'Ergonomic Mouse', price: 89.00, desc: 'Vertical design to reduce wrist strain.' },
      { id: 'prod-3', name: '4K Monitor', price: 599.50, desc: '32-inch IPS panel with 144Hz refresh rate.' },
    ];

    for (const p of products) {
      const product = await prisma.product.upsert({
        where: { id: p.id },
        update: {},
        create: { id: p.id, name: p.name, price: p.price, description: p.desc },
      });

      for (const w of [w1, w2]) {
        await prisma.stock.upsert({
          where: { productId_warehouseId: { productId: product.id, warehouseId: w.id } },
          update: {},
          create: {
            productId: product.id,
            warehouseId: w.id,
            totalUnits: p.id === 'prod-3' ? 2 : 10,
            reservedUnits: 0
          }
        });
      }
    }
    console.log('DATABASE_INITIALIZATION_SUCCESS');
  } catch (e) {
    console.error('DATABASE_INITIALIZATION_FAILED', e);
  }
}

export async function GET() {
  try {
    // Ensure base data exists (non-blocking if possible, but first request will handle it)
    await ensureBaseData();

    // Trigger cleanup and wait for it to ensure consistent stock levels
    await cleanupExpiredReservations().catch(e => console.error('Cleanup failed:', e));

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
