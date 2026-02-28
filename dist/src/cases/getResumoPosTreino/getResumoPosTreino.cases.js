"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetResumoPosTreinoUseCase = void 0;
const prisma_1 = require("../../lib/prisma");
function roundTo(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
function buildExecucao(peso, repeticoes) {
    return {
        peso,
        repeticoes,
        score: roundTo(peso * repeticoes),
    };
}
function compareScore(current, previous) {
    const diff = current - previous;
    if (Math.abs(diff) < 0.001)
        return 0;
    return diff > 0 ? 1 : -1;
}
function toDestaque(exercicio) {
    if (!exercicio.atual || !exercicio.anterior || !exercicio.variacao)
        return null;
    return {
        exercicioNome: exercicio.exercicioNome,
        variacaoPeso: exercicio.variacao.peso,
        variacaoRepeticoes: exercicio.variacao.repeticoes,
        variacaoScore: exercicio.variacao.score,
        atual: {
            peso: exercicio.atual.peso,
            repeticoes: exercicio.atual.repeticoes,
        },
        anterior: {
            peso: exercicio.anterior.peso,
            repeticoes: exercicio.anterior.repeticoes,
        },
    };
}
class GetResumoPosTreinoUseCase {
    async execute(request) {
        const { userId, sessaoId } = request;
        const sessao = await prisma_1.prisma.sESSAO_TREINO.findFirst({
            where: {
                ID: sessaoId,
                USER_ID: userId,
                FINALIZADO_EM: {
                    not: null,
                },
            },
            include: {
                TREINO: true,
                EXECUCOES: true,
            },
        });
        if (!sessao || !sessao.FINALIZADO_EM) {
            throw new Error("Sessão finalizada não encontrada para gerar resumo.");
        }
        const [treinoExercicios, sessaoAnterior] = await Promise.all([
            prisma_1.prisma.tREINO_EXERCICIO.findMany({
                where: {
                    TREINO_ID: sessao.TREINO_ID,
                },
                orderBy: {
                    ORDEM: "asc",
                },
                include: {
                    EXERCICIO: true,
                },
            }),
            prisma_1.prisma.sESSAO_TREINO.findFirst({
                where: {
                    USER_ID: userId,
                    TREINO_ID: sessao.TREINO_ID,
                    FINALIZADO_EM: {
                        not: null,
                    },
                    ID: {
                        not: sessaoId,
                    },
                },
                orderBy: [{ FINALIZADO_EM: "desc" }, { INICIADO_EM: "desc" }],
                include: {
                    EXECUCOES: true,
                },
            }),
        ]);
        const currentExecucoesByExercicio = new Map(sessao.EXECUCOES.map((execucao) => [execucao.EXERCICIO_ID, execucao]));
        const previousExecucoesByExercicio = new Map((sessaoAnterior?.EXECUCOES ?? []).map((execucao) => [execucao.EXERCICIO_ID, execucao]));
        let melhorou = 0;
        let manteve = 0;
        let piorou = 0;
        let semHistorico = 0;
        const exercicios = treinoExercicios.map((treinoExercicio) => {
            const current = currentExecucoesByExercicio.get(treinoExercicio.EXERCICIO_ID);
            const previous = previousExecucoesByExercicio.get(treinoExercicio.EXERCICIO_ID);
            if (!current) {
                return {
                    exercicioId: treinoExercicio.EXERCICIO_ID,
                    exercicioNome: treinoExercicio.EXERCICIO.NOME,
                    ordem: treinoExercicio.ORDEM,
                    registrado: false,
                };
            }
            const atual = buildExecucao(current.PESO, current.REPETICOES);
            if (!previous) {
                semHistorico += 1;
                return {
                    exercicioId: treinoExercicio.EXERCICIO_ID,
                    exercicioNome: treinoExercicio.EXERCICIO.NOME,
                    ordem: treinoExercicio.ORDEM,
                    registrado: true,
                    status: "SEM_HISTORICO",
                    atual,
                };
            }
            const anterior = buildExecucao(previous.PESO, previous.REPETICOES);
            const variacao = {
                peso: roundTo(atual.peso - anterior.peso),
                repeticoes: atual.repeticoes - anterior.repeticoes,
                score: roundTo(atual.score - anterior.score),
            };
            const scoreComparison = compareScore(atual.score, anterior.score);
            let status = "MANTEVE";
            if (scoreComparison > 0) {
                status = "MELHOROU";
                melhorou += 1;
            }
            else if (scoreComparison < 0) {
                status = "PIOROU";
                piorou += 1;
            }
            else {
                status = "MANTEVE";
                manteve += 1;
            }
            return {
                exercicioId: treinoExercicio.EXERCICIO_ID,
                exercicioNome: treinoExercicio.EXERCICIO.NOME,
                ordem: treinoExercicio.ORDEM,
                registrado: true,
                status,
                atual,
                anterior,
                variacao,
            };
        });
        const exerciciosRegistrados = exercicios.filter((exercicio) => exercicio.registrado).length;
        const exerciciosPlanejados = exercicios.length;
        const exerciciosSemRegistro = exerciciosPlanejados - exerciciosRegistrados;
        const taxaConclusaoPercentual = exerciciosPlanejados === 0
            ? 0
            : Math.round((exerciciosRegistrados / exerciciosPlanejados) * 100);
        const melhorias = exercicios
            .filter((exercicio) => exercicio.registrado && exercicio.status === "MELHOROU")
            .map(toDestaque)
            .filter((destaque) => destaque !== null)
            .sort((a, b) => b.variacaoScore - a.variacaoScore)
            .slice(0, 3);
        const quedas = exercicios
            .filter((exercicio) => exercicio.registrado && exercicio.status === "PIOROU")
            .map(toDestaque)
            .filter((destaque) => destaque !== null)
            .sort((a, b) => a.variacaoScore - b.variacaoScore)
            .slice(0, 3);
        const duracaoMs = sessao.FINALIZADO_EM.getTime() - sessao.INICIADO_EM.getTime();
        const duracaoMinutos = Math.max(1, Math.round(duracaoMs / 60000));
        return {
            treino: {
                id: sessao.TREINO_ID,
                nome: sessao.TREINO.NOME,
            },
            sessao: {
                id: sessao.ID,
                iniciadoEm: sessao.INICIADO_EM,
                finalizadoEm: sessao.FINALIZADO_EM,
                duracaoMinutos,
            },
            totais: {
                exerciciosPlanejados,
                exerciciosRegistrados,
                exerciciosSemRegistro,
                taxaConclusaoPercentual,
            },
            comparativo: {
                possuiHistoricoAnterior: Boolean(sessaoAnterior),
                melhorou,
                manteve,
                piorou,
                semHistorico,
                exercicios,
            },
            destaques: {
                melhores: melhorias,
                quedas,
            },
        };
    }
}
exports.GetResumoPosTreinoUseCase = GetResumoPosTreinoUseCase;
