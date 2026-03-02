import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { env } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Polyfill WebSocket for Neon serverless in local dev (Node.js has no native WS)
if (env.NODE_ENV !== "production") {
  neonConfig.webSocketConstructor = ws;
}

function createPrismaClient() {
  const connectionString = env.DATABASE_URL;
  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
