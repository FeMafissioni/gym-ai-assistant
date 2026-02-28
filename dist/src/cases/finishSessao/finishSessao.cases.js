"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinishSessaoUseCase = void 0;
const prisma_1 = require("../../lib/prisma");
const getSessaoAtiva_cases_1 = require("../getSessaoAtiva/getSessaoAtiva.cases");
class FinishSessaoUseCase {
    async execute(request) {
        const { userId } = request;
        // 1️⃣ Buscar sessão ativa
        const getActiveSession = new getSessaoAtiva_cases_1.GetSessaoAtivaUseCase();
        const session = await getActiveSession.execute({ userId });
        if (session.dataFinalizado) {
            throw new Error("Sessão já está finalizada.");
        }
        // 2️⃣ Finalizar sessão
        const sessaoFinalizada = await prisma_1.prisma.sESSAO_TREINO.update({
            where: {
                ID: session.sessionId,
            },
            data: {
                FINALIZADO_EM: new Date(),
            },
        });
        return {
            sessaoId: sessaoFinalizada.ID,
            finalizadaEm: sessaoFinalizada.FINALIZADO_EM,
        };
    }
}
exports.FinishSessaoUseCase = FinishSessaoUseCase;
