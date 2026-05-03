import { PrismaClient } from '../../prisma/generated-client-v3';

const prismaClientSingleton = () => {
  // Use DIRECT_URL for scripts/initialization and DATABASE_URL for general use
  // However, in low-connection environments, DIRECT_URL is often more stable
  let url = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
  
  const isDirect = !!process.env.DIRECT_URL;

  // Optimization for serverless: limit connections per function instance
  // If we are using the pooler (not direct), we need pgbouncer=true
  if (url && !url.includes('connection_limit')) {
    const separator = url.includes('?') ? '&' : '?';
    const pgbouncer = !isDirect ? '&pgbouncer=true' : '';
    url = `${url}${separator}connection_limit=1${pgbouncer}`;
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

// In serverless, we want to try and reuse the client across function warm-starts
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

// Always cache in globalThis to prevent multiple clients in the same worker
globalThis.prismaGlobal = prisma;

