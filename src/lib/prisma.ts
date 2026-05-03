import { PrismaClient } from '../../prisma/generated-client-v3';

const prismaClientSingleton = () => {
  let url = process.env.DATABASE_URL;
  if (url && url.startsWith('postgres') && !url.includes('pgbouncer=true') && !url.includes('statement_cache_size=0')) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}pgbouncer=true`;
    process.env.DATABASE_URL = url; // Update env for other parts of the app
    console.log('Using pgbouncer=true connection URL');
  }
  const client = new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });
  
  // Log available models to debug synchronization issues
  console.log('PRISMA_MODELS_DISCOVERY:', Object.keys(client).filter(k => !k.startsWith('_') && !k.startsWith('$')));
  
  return client;
};

const prisma = prismaClientSingleton();

export default prisma;

