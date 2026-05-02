import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.user.count({ where: { role: 'ADMIN' } });
  console.log('ADMIN_COUNT:', count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
