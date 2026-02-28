"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaveUserUseCase = void 0;
const prisma_1 = require("../../lib/prisma");
class SaveUserUseCase {
    async execute(request) {
        const { telegramId, nome } = request;
        const existingUser = await prisma_1.prisma.uSER.findUnique({
            where: {
                TELEGRAM_ID: telegramId,
            },
        });
        if (existingUser) {
            if (existingUser.NOME !== nome) {
                await prisma_1.prisma.uSER.update({
                    where: { ID: existingUser.ID },
                    data: { NOME: nome },
                });
            }
            return {
                id: existingUser.ID,
                telegramId: existingUser.TELEGRAM_ID,
                nome,
                created: false,
            };
        }
        const newUser = await prisma_1.prisma.uSER.create({
            data: {
                TELEGRAM_ID: telegramId,
                NOME: nome,
            },
        });
        return {
            id: newUser.ID,
            telegramId: newUser.TELEGRAM_ID,
            nome: newUser.NOME,
            created: true,
        };
    }
}
exports.SaveUserUseCase = SaveUserUseCase;
