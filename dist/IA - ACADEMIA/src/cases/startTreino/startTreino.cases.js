"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartTreinoUseCase = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class StartTreinoUseCase {
    async execute({ userId, treinoId }) {
        const activeSession = await prisma.sESSAO_TREINO.findFirst({
            where: {
                USER_ID: userId,
                FINALIZADO_EM: null,
            },
        });
        if (activeSession) {
            throw new Error("Você já possui uma sessão de treino ativa.");
        }
        const primeiroExercicio = await prisma.tREINO_EXERCICIO.findFirst({
            where: {
                TREINO_ID: treinoId,
                ORDEM: 1,
            },
            include: {
                TREINO: true,
            },
        });
        if (!primeiroExercicio) {
            throw new Error("Treino não possui exercícios.");
        }
        const sessao = await prisma.sESSAO_TREINO.create({
            data: {
                USER_ID: userId,
                TREINO_ID: treinoId,
                DATA_INICIO: new Date(),
                EXERCICIO_ATUAL_ID: primeiroExercicio.EXERCICIO_ID,
            },
        });
        return {
            sessaoId: sessao.ID,
            treinoNome: primeiroExercicio.TREINO.NOME,
            primeiroExercicio: {
                id: primeiroExercicio.EXERCICIO_ID,
                nome: primeiroExercicio.EXERCICIO.NOME,
            },
        };
    }
}
exports.StartTreinoUseCase = StartTreinoUseCase;
