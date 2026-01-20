import { PrismaClient } from '../generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import dotenv from'dotenv'
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

dotenv.config();

// Neon serverless setup
neonConfig.webSocketConstructor = ws;

// Déclarer global.prisma pour TypeScript
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in .env");
}

const adapter = new PrismaNeon({ connectionString });

// Utilise la même instance en dev pour éviter le hot reload multiple
const prisma = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV === 'development') global.prisma = prisma;

export default prisma;