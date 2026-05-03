import { PrismaClient } from '../../prisma/generated-client-v3';

const prismaClientSingleton = () => {
  let url = process.env.DATABASE_URL || '';
  
  // Optimization for serverless: limit connections per function instance
  if (url && !url.includes('connection_limit')) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}connection_limit=1&pgbouncer=true`;
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

