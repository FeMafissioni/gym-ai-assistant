"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSessaoAtivaUseCase = void 0;
const prisma_1 = require("../../lib/prisma");
class GetSessaoAtivaUseCase {
    async execute(request) {
        const { userId } = request;
        const session = await prisma_1.prisma.sESSAO_TREINO.findFirst({
            where: {
                USER_ID: userId,
                FINALIZADO_EM: null,
            },
            include: {
                TREINO: true,
            },
        });
        if (!session) {
            throw new Error("Você não possui sessão de treino ativa.");
        }
        return {
            sessionId: session.ID,
            treinoId: session.TREINO_ID,
            treinoNome: session.TREINO.NOME,
            exercicioAtualId: session.EXERCICIO_ATUAL_ID,
            dataFinalizado: session.FINALIZADO_EM || undefined,
        };
    }
}
exports.GetSessaoAtivaUseCase = GetSessaoAtivaUseCase;
