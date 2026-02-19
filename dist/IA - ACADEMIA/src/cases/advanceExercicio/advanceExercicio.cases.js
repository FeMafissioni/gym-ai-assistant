"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvanceExercicioUseCase = void 0;
const client_1 = require("@prisma/client");
const getSessaoAtiva_cases_1 = require("../getSessaoAtiva/getSessaoAtiva.cases");
const getCurrentExercicio_cases_1 = require("../getCurrentExercicio/getCurrentExercicio.cases");
const prisma = new client_1.PrismaClient();
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
        const proximoTreinoExercicio = await prisma.tREINO_EXERCICIO.findFirst({
            where: {
                TREINO_ID: session.treinoId,
                ORDEM: current.exercicio.order + 1,
            },
            include: {
                EXERCICIO: true,
            },
        });
        if (!proximoTreinoExercicio) {
            await prisma.sESSAO_TREINO.update({
                where: {
                    ID: session.sessionId,
                },
                data: {
                    DATA_FIM: new Date(),
                },
            });
            return {
                sessaoId: session.sessionId,
                exercicioAtual: null,
                sessaoFinalizada: true,
            };
        }
        await prisma.sESSAO_TREINO.update({
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
