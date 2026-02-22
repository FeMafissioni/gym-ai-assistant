"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvanceExercicioUseCase = void 0;
const prisma_1 = require("../../lib/prisma");
const getSessaoAtiva_cases_1 = require("../getSessaoAtiva/getSessaoAtiva.cases");
const getCurrentExercicio_cases_1 = require("../getCurrentExercicio/getCurrentExercicio.cases");
class AdvanceExercicioUseCase {
    async execute(request) {
        const { userId } = request;
        // 1️⃣ Buscar sessão ativa
        const getActiveSession = new getSessaoAtiva_cases_1.GetSessaoAtivaUseCase();
        const session = await getActiveSession.execute({ userId });
        if (!session.exercicioAtualId) {
            throw new Error("Sessão não possui exercício atual definido.");
        }
        const getCurrent = new getCurrentExercicio_cases_1.GetCurrentExercicioUseCase();
        const current = await getCurrent.execute({ userId });
        const proximoTreinoExercicio = await prisma_1.prisma.tREINO_EXERCICIO.findFirst({
            where: {
                TREINO_ID: session.treinoId,
                ORDEM: current.order + 1,
            },
            include: {
                EXERCICIO: true,
            },
        });
        if (!proximoTreinoExercicio) {
            await prisma_1.prisma.sESSAO_TREINO.update({
                where: {
                    ID: session.sessionId,
                },
                data: {
                    FINALIZADO_EM: new Date(),
                },
            });
            return {
                sessaoId: session.sessionId,
                exercicioAtual: null,
                sessaoFinalizada: true,
            };
        }
        await prisma_1.prisma.sESSAO_TREINO.update({
            where: {
                ID: session.sessionId,
            },
            data: {
                EXERCICIO_ATUAL_ID: proximoTreinoExercicio.EXERCICIO_ID,
            },
        });
        return {
            sessaoId: session.sessionId,
            exercicioAtual: {
                id: proximoTreinoExercicio.EXERCICIO.ID,
                nome: proximoTreinoExercicio.EXERCICIO.NOME,
            },
            sessaoFinalizada: false,
        };
    }
}
exports.AdvanceExercicioUseCase = AdvanceExercicioUseCase;
