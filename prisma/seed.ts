import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean up
  await prisma.reservation.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin User
  const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
  await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@allo.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('Admin user created: admin@allo.com / AdminPassword123!');

  // Create Warehouses
  const w1 = await prisma.warehouse.create({
    data: { name: 'Main Warehouse (London)' },
  });
  const w2 = await prisma.warehouse.create({
    data: { name: 'East Coast Hub (New York)' },
  });

  // Create Products
  const p1 = await prisma.product.create({
    data: {
      name: 'Mechanical Keyboard',
      description: 'Tactile, wireless, and RGB backlit.',
      price: 129.99,
    },
  });
  const p2 = await prisma.product.create({
    data: {
      name: 'Ergonomic Mouse',
      description: 'Vertical design to reduce wrist strain.',
      price: 89.00,
    },
  });
  const p3 = await prisma.product.create({
    data: {
      name: '4K Monitor',
      description: '32-inch IPS panel with 144Hz refresh rate.',
      price: 599.50,
    },
  });

  // Create Stock
  await prisma.stock.createMany({
    data: [
      { productId: p1.id, warehouseId: w1.id, totalUnits: 10, reservedUnits: 0 },
      { productId: p1.id, warehouseId: w2.id, totalUnits: 5, reservedUnits: 0 },
      { productId: p2.id, warehouseId: w1.id, totalUnits: 20, reservedUnits: 0 },
      { productId: p3.id, warehouseId: w2.id, totalUnits: 2, reservedUnits: 0 },
    ],
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
