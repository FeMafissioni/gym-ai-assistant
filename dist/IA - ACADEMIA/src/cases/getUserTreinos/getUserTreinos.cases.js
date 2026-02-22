"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUserTreinosUseCase = void 0;
const prisma_1 = require("../../lib/prisma");
class GetUserTreinosUseCase {
    async execute(request) {
        const { userId } = request;
        const userTreinos = await prisma_1.prisma.tREINO.findMany({
            where: {
                USER_ID: userId,
            },
            select: {
                ID: true,
                NOME: true,
            },
        });
        return {
            treinos: userTreinos.map((treino) => ({
                treinoId: treino.ID,
                nome: treino.NOME,
            })),
        };
    }
}
exports.GetUserTreinosUseCase = GetUserTreinosUseCase;
