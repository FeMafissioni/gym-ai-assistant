"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSessaoAtivaUseCase = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class GetSessaoAtivaUseCase {
    async execute(request) {
        const { userId } = request;
        const session = await prisma.sESSAO_TREINO.findFirst({
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
            dataFinalizado: session.DATA_FIM || undefined,
        };
    }
}
exports.GetSessaoAtivaUseCase = GetSessaoAtivaUseCase;
