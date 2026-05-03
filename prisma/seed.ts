import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting stable seed process...');

  // 1. Create/Verify Admin User (Safe)
  const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@allo.com' },
    update: {}, // Don't overwrite if exists
    create: {
      name: 'System Administrator',
      email: 'admin@allo.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('Admin user verified: admin@allo.com');

  // 2. Create/Verify Warehouses (Safe)
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

  // 3. Create/Verify Products and Initial Stock
  const baseProducts = [
    { id: 'prod-1', name: 'Mechanical Keyboard', price: 129.99, desc: 'Tactile, wireless, and RGB backlit.' },
    { id: 'prod-2', name: 'Ergonomic Mouse', price: 89.00, desc: 'Vertical design to reduce wrist strain.' },
    { id: 'prod-3', name: '4K Monitor', price: 599.50, desc: '32-inch IPS panel with 144Hz refresh rate.' },
  ];

  for (const p of baseProducts) {
    const product = await prisma.product.upsert({
      where: { id: p.id },
      update: { name: p.name, price: p.price, description: p.desc },
      create: { id: p.id, name: p.name, price: p.price, description: p.desc },
    });

    // Seed initial stock only if missing
    for (const w of [w1, w2]) {
      const existingStock = await prisma.stock.findUnique({
        where: { productId_warehouseId: { productId: product.id, warehouseId: w.id } }
      });

      if (!existingStock) {
        await prisma.stock.create({
          data: {
            productId: product.id,
            warehouseId: w.id,
            totalUnits: p.id === 'prod-3' ? 2 : 10,
            reservedUnits: 0
          }
        });
      }
    }
  }

  console.log('Seed data synchronization completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
