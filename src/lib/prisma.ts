import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../../generated/prisma/client";

const databaseCandidates = [
  path.resolve(process.cwd(), "prisma", "gym.db"),
  path.resolve(__dirname, "..", "..", "prisma", "gym.db"),
  path.resolve(__dirname, "..", "..", "..", "..", "prisma", "gym.db"),
];

const databasePath =
  databaseCandidates.find((candidate) => existsSync(candidate)) ??
  databaseCandidates[0];

const databaseUrl = `file:${databasePath}`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

export { prisma };
