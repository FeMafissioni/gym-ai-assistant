"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const client_1 = require("../../generated/prisma/client");
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
