import { PrismaClient } from '../../prisma/generated-client-v3';

const prismaClientSingleton = () => {
  // STRICT: We MUST use the Pooler (DATABASE_URL) for production stability
  // The DIRECT_URL is only for migrations and should not be used in the app
  let url = process.env.DATABASE_URL || '';
  
  if (url) {
    const separator = url.includes('?') ? '&' : '?';
    // Force connection limit to 1 per function and enable pgbouncer mode
    if (!url.includes('connection_limit')) {
      url = `${url}${separator}connection_limit=1&pgbouncer=true`;
    } else if (!url.includes('pgbouncer=true')) {
      url = `${url}&pgbouncer=true`;
    }
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

// Always cache the instance
globalThis.prismaGlobal = prisma;

