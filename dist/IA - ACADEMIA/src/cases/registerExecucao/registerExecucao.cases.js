"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterExecucaoUseCase = void 0;
const client_1 = require("@prisma/client");
const getSessaoAtiva_cases_1 = require("../getSessaoAtiva/getSessaoAtiva.cases");
const prisma = new client_1.PrismaClient();
class RegisterExecucaoUseCase {
    async execute(request) {
        const { userId, peso, repeticoes } = request;
        const getActiveSession = new getSessaoAtiva_cases_1.GetSessaoAtivaUseCase();
        const session = await getActiveSession.execute({ userId });
        if (!session.exercicioAtualId) {
            throw new Error("Sessão não possui exercício atual definido.");
        }
        await prisma.eXECUCAO_EXERCICIO.upsert({
            where: {
                SESSAO_TREINO_ID_EXERCICIO_ID: {
                    SESSAO_TREINO_ID: session.sessionId,
                    EXERCICIO_ID: session.exercicioAtualId,
                },
            },
            update: {
                PESO: peso,
                REPETICOES: repeticoes,
            },
            create: {
                SESSAO_TREINO_ID: session.sessionId,
                EXERCICIO_ID: session.exercicioAtualId,
                PESO: peso,
                REPETICOES: repeticoes,
            },
        });
        const exercicio = await prisma.eXERCICIO.findUnique({
            where: { ID: session.exercicioAtualId },
        });
        return {
            exercicioAtual: {
                id: exercicio.ID,
                nome: exercicio.NOME,
            },
        };
    }
}
exports.RegisterExecucaoUseCase = RegisterExecucaoUseCase;
