"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCurrentExercicioUseCase = void 0;
const client_1 = require("@prisma/client");
const getSessaoAtiva_cases_1 = require("../getSessaoAtiva/getSessaoAtiva.cases");
const prisma = new client_1.PrismaClient();
class GetCurrentExercicioUseCase {
    async execute(request) {
        const { userId } = request;
        // 1️⃣ Buscar sessão ativa
        const getActiveSession = new getSessaoAtiva_cases_1.GetSessaoAtivaUseCase();
        const session = await getActiveSession.execute({ userId });
        if (!session.exercicioAtualId) {
            throw new Error("Sessão ativa não possui exercício atual definido.");
        }
        // 2️⃣ Buscar exercício atual
        const exercicio = await prisma.tREINO_EXERCICIO.findFirst({
            where: {
                TREINO_ID: session.treinoId,
                EXERCICIO_ID: session.exercicioAtualId,
            },
            include: {
                EXERCICIO: true,
            },
        });
        if (!exercicio) {
            throw new Error("Exercício atual não encontrado.");
        }
        return {
            sessaoId: session.sessionId,
            exercicio: {
                id: exercicio.ID,
                nome: exercicio.NOME,
                order: exercicio.ORDEM,
            },
        };
    }
}
exports.GetCurrentExercicioUseCase = GetCurrentExercicioUseCase;
