"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const client_1 = require("../../generated/prisma/client");
const databaseCandidates = [
    node_path_1.default.resolve(process.cwd(), "prisma", "gym.db"),
    node_path_1.default.resolve(__dirname, "..", "..", "prisma", "gym.db"),
    node_path_1.default.resolve(__dirname, "..", "..", "..", "..", "prisma", "gym.db"),
];
const databasePath = databaseCandidates.find((candidate) => (0, node_fs_1.existsSync)(candidate)) ??
    databaseCandidates[0];
const databaseUrl = `file:${databasePath}`;
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: databaseUrl,
        },
    },
});
exports.prisma = prisma;
