"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinishSessaoUseCase = void 0;
const client_1 = require("@prisma/client");
const getSessaoAtiva_cases_1 = require("../getSessaoAtiva/getSessaoAtiva.cases");
const prisma = new client_1.PrismaClient();
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
        const sessaoFinalizada = await prisma.sESSAO_TREINO.update({
            where: {
                ID: session.sessionId,
            },
            data: {
                STATUS: "FINALIZADO",
                DATA_FIM: new Date(),
            },
        });
        return {
            sessaoId: sessaoFinalizada.ID,
            finalizadaEm: sessaoFinalizada.DATA_FIM,
        };
    }
}
exports.FinishSessaoUseCase = FinishSessaoUseCase;
