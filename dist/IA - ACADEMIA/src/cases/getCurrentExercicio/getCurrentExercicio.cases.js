"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCurrentExercicioUseCase = void 0;
const prisma_1 = require("../../lib/prisma");
const getSessaoAtiva_cases_1 = require("../getSessaoAtiva/getSessaoAtiva.cases");
class GetCurrentExercicioUseCase {
    constructor(dependencies = {}) {
        this.activeSessionProvider =
            dependencies.activeSessionProvider ?? new getSessaoAtiva_cases_1.GetSessaoAtivaUseCase();
        this.db = dependencies.db ?? prisma_1.prisma;
    }
    async execute(request) {
        const { userId } = request;
        const session = await this.activeSessionProvider.execute({ userId });
        if (!session.exercicioAtualId) {
            throw new Error("Sessão ativa não possui exercício atual definido.");
        }
        const [exercicio, ultimaSessaoFinalizada] = await Promise.all([
            this.db.tREINO_EXERCICIO.findFirst({
                where: {
                    TREINO_ID: session.treinoId,
                    EXERCICIO_ID: session.exercicioAtualId,
                },
                include: {
                    EXERCICIO: true,
                },
            }),
            this.db.sESSAO_TREINO.findFirst({
                where: {
                    USER_ID: userId,
                    TREINO_ID: session.treinoId,
                    FINALIZADO_EM: {
                        not: null,
                    },
                    ID: {
                        not: session.sessionId,
                    },
                },
                orderBy: [
                    { FINALIZADO_EM: "desc" },
                    { INICIADO_EM: "desc" },
                ],
                select: {
                    ID: true,
                },
            }),
        ]);
        if (!exercicio) {
            throw new Error("Exercício atual não encontrado.");
        }
        const ultimoRegistro = ultimaSessaoFinalizada
            ? await this.db.eXECUCAO_EXERCICIO.findUnique({
                where: {
                    SESSAO_TREINO_ID_EXERCICIO_ID: {
                        SESSAO_TREINO_ID: ultimaSessaoFinalizada.ID,
                        EXERCICIO_ID: session.exercicioAtualId,
                    },
                },
                select: {
                    PESO: true,
                    REPETICOES: true,
                },
            })
            : null;
        return {
            id: exercicio.ID,
            nome: exercicio.EXERCICIO.NOME,
            order: exercicio.ORDEM,
            pesoUltimoRegistro: ultimoRegistro?.PESO,
            repUltimoRegistro: ultimoRegistro?.REPETICOES,
        };
    }
}
exports.GetCurrentExercicioUseCase = GetCurrentExercicioUseCase;
