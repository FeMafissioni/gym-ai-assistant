"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviousExercicioUseCase = void 0;
const prisma_1 = require("../../lib/prisma");
const getCurrentExercicio_cases_1 = require("../getCurrentExercicio/getCurrentExercicio.cases");
const getSessaoAtiva_cases_1 = require("../getSessaoAtiva/getSessaoAtiva.cases");
class PreviousExercicioUseCase {
    async execute(request) {
        const { userId } = request;
        const getActiveSession = new getSessaoAtiva_cases_1.GetSessaoAtivaUseCase();
        const session = await getActiveSession.execute({ userId });
        if (!session.exercicioAtualId) {
            throw new Error("Sessão não possui exercício atual definido.");
        }
        const getCurrent = new getCurrentExercicio_cases_1.GetCurrentExercicioUseCase();
        const current = await getCurrent.execute({ userId });
        const exercicioAnterior = await prisma_1.prisma.tREINO_EXERCICIO.findFirst({
            where: {
                TREINO_ID: session.treinoId,
                ORDEM: current.order - 1,
            },
            include: {
                EXERCICIO: true,
            },
        });
        if (!exercicioAnterior) {
            return {
                sessaoId: session.sessionId,
                exercicioAtual: null,
                hasPreviousExercicio: false,
            };
        }
        await prisma_1.prisma.sESSAO_TREINO.update({
            where: {
                ID: session.sessionId,
            },
            data: {
                EXERCICIO_ATUAL_ID: exercicioAnterior.EXERCICIO_ID,
            },
        });
        return {
            sessaoId: session.sessionId,
            exercicioAtual: {
                id: exercicioAnterior.EXERCICIO.ID,
                nome: exercicioAnterior.EXERCICIO.NOME,
            },
            hasPreviousExercicio: true,
        };
    }
}
exports.PreviousExercicioUseCase = PreviousExercicioUseCase;
