import { PrismaClient } from '@prisma/client';

// Global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database connection functions
export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected successfully (Prisma)');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

export const closeDB = async (): Promise<void> => {
  await prisma.$disconnect();
  console.log('🔌 Database connection closed (Prisma)');
};

export default prisma;
