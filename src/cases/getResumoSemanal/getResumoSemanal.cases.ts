import { prisma } from "../../lib/prisma";
import {
  GetResumoSemanalRequest,
  GetResumoSemanalResult,
  ResumoSemanalBasico,
  ResumoSemanalDestaqueExercicio,
  ResumoSemanalSnapshot,
  ResumoSemanalTreinoFrequencia,
} from "./types/getResumoSemanal.types";

type SessionWithRelations = {
  ID: string;
  INICIADO_EM: Date;
  FINALIZADO_EM: Date;
  TREINO_ID: string;
  TREINO: {
    NOME: string;
    EXERCICIOS: Array<{ ID: string }>;
  };
  EXECUCOES: Array<{
    EXERCICIO_ID: string;
    PESO: number;
    REPETICOES: number;
    EXERCICIO: {
      NOME: string;
    };
  }>;
};

function roundTo(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getWeekRange(referenceDate: Date) {
  const current = new Date(referenceDate);
  const dayOfWeek = current.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;

  const start = new Date(current);
  start.setDate(current.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    start,
    end,
  };
}

function buildBasicStats(sessions: SessionWithRelations[]): ResumoSemanalBasico {
  if (!sessions.length) {
    return {
      sessoesFinalizadas: 0,
      diasTreinados: 0,
      duracaoMediaMinutos: 0,
      exerciciosRegistrados: 0,
      exerciciosPlanejados: 0,
      taxaConclusaoMediaPercentual: 0,
    };
  }

  const diasTreinados = new Set<string>();
  let somaDuracaoMinutos = 0;
  let exerciciosRegistrados = 0;
  let exerciciosPlanejados = 0;
  let somaTaxaConclusao = 0;

  for (const session of sessions) {
    diasTreinados.add(dateKey(session.FINALIZADO_EM));

    const durationMs = session.FINALIZADO_EM.getTime() - session.INICIADO_EM.getTime();
    const durationMinutes = Math.max(1, Math.round(durationMs / 60000));
    somaDuracaoMinutos += durationMinutes;

    const registrados = session.EXECUCOES.length;
    const planejados = session.TREINO.EXERCICIOS.length;

    exerciciosRegistrados += registrados;
    exerciciosPlanejados += planejados;

    const taxa = planejados === 0 ? 0 : (registrados / planejados) * 100;
    somaTaxaConclusao += taxa;
  }

  return {
    sessoesFinalizadas: sessions.length,
    diasTreinados: diasTreinados.size,
    duracaoMediaMinutos: roundTo(somaDuracaoMinutos / sessions.length),
    exerciciosRegistrados,
    exerciciosPlanejados,
    taxaConclusaoMediaPercentual: roundTo(somaTaxaConclusao / sessions.length),
  };
}

function buildProgressao(sessions: SessionWithRelations[]) {
  const exerciseHistory = new Map<
    string,
    Array<{
      exercicioNome: string;
      snapshot: ResumoSemanalSnapshot;
    }>
  >();

  for (const session of sessions) {
    for (const execucao of session.EXECUCOES) {
      const snapshot: ResumoSemanalSnapshot = {
        peso: execucao.PESO,
        repeticoes: execucao.REPETICOES,
        score: roundTo(execucao.PESO * execucao.REPETICOES),
        finalizadoEm: session.FINALIZADO_EM,
      };

      const history = exerciseHistory.get(execucao.EXERCICIO_ID) ?? [];
      history.push({
        exercicioNome: execucao.EXERCICIO.NOME,
        snapshot,
      });
      exerciseHistory.set(execucao.EXERCICIO_ID, history);
    }
  }

  const detalhes: ResumoSemanalDestaqueExercicio[] = [];
  let melhoras = 0;
  let estagnados = 0;
  let quedas = 0;

  for (const [exercicioId, history] of exerciseHistory.entries()) {
    if (history.length < 2) continue;

    const ordered = history.sort(
      (a, b) => a.snapshot.finalizadoEm.getTime() - b.snapshot.finalizadoEm.getTime()
    );
    const primeiro = ordered[0].snapshot;
    const ultimo = ordered[ordered.length - 1].snapshot;

    const variacaoScore = roundTo(ultimo.score - primeiro.score);
    const variacaoPeso = roundTo(ultimo.peso - primeiro.peso);
    const variacaoRepeticoes = ultimo.repeticoes - primeiro.repeticoes;

    if (variacaoScore > 0.001) melhoras += 1;
    else if (variacaoScore < -0.001) quedas += 1;
    else estagnados += 1;

    detalhes.push({
      exercicioId,
      exercicioNome: ordered[0].exercicioNome,
      sessoesNoPeriodo: ordered.length,
      primeiro,
      ultimo,
      variacaoPeso,
      variacaoRepeticoes,
      variacaoScore,
    });
  }

  const melhores = detalhes
    .filter((item) => item.variacaoScore > 0.001)
    .sort((a, b) => b.variacaoScore - a.variacaoScore)
    .slice(0, 3);

  const quedasDetalhes = detalhes
    .filter((item) => item.variacaoScore < -0.001)
    .sort((a, b) => a.variacaoScore - b.variacaoScore)
    .slice(0, 3);

  return {
    exerciciosComHistorico: detalhes.length,
    melhoras,
    estagnados,
    quedas,
    melhores,
    quedasDetalhes,
  };
}

function buildTreinosMaisFeitos(sessions: SessionWithRelations[]): ResumoSemanalTreinoFrequencia[] {
  const treinoCounter = new Map<string, ResumoSemanalTreinoFrequencia>();

  for (const session of sessions) {
    const current = treinoCounter.get(session.TREINO_ID);
    if (!current) {
      treinoCounter.set(session.TREINO_ID, {
        treinoId: session.TREINO_ID,
        treinoNome: session.TREINO.NOME,
        totalSessoes: 1,
      });
      continue;
    }

    current.totalSessoes += 1;
  }

  return Array.from(treinoCounter.values())
    .sort((a, b) => b.totalSessoes - a.totalSessoes)
    .slice(0, 3);
}

export class GetResumoSemanalUseCase {
  async execute(request: GetResumoSemanalRequest): Promise<GetResumoSemanalResult> {
    const { userId, referenceDate = new Date() } = request;

    const currentWeek = getWeekRange(referenceDate);

    const previousWeekStart = new Date(currentWeek.start);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    previousWeekStart.setHours(0, 0, 0, 0);

    const previousWeekEnd = new Date(currentWeek.end);
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);
    previousWeekEnd.setHours(23, 59, 59, 999);

    const [sessionsCurrent, sessionsPrevious] = await Promise.all([
      prisma.sESSAO_TREINO.findMany({
        where: {
          USER_ID: userId,
          FINALIZADO_EM: {
            gte: currentWeek.start,
            lte: currentWeek.end,
          },
        },
        include: {
          TREINO: {
            include: {
              EXERCICIOS: {
                select: {
                  ID: true,
                },
              },
            },
          },
          EXECUCOES: {
            include: {
              EXERCICIO: {
                select: {
                  NOME: true,
                },
              },
            },
          },
        },
        orderBy: {
          FINALIZADO_EM: "asc",
        },
      }),
      prisma.sESSAO_TREINO.findMany({
        where: {
          USER_ID: userId,
          FINALIZADO_EM: {
            gte: previousWeekStart,
            lte: previousWeekEnd,
          },
        },
        include: {
          TREINO: {
            include: {
              EXERCICIOS: {
                select: {
                  ID: true,
                },
              },
            },
          },
          EXECUCOES: {
            include: {
              EXERCICIO: {
                select: {
                  NOME: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const current = sessionsCurrent as SessionWithRelations[];
    const previous = sessionsPrevious as SessionWithRelations[];

    const totais = buildBasicStats(current);
    const totaisSemanaAnterior = buildBasicStats(previous);
    const progressao = buildProgressao(current);
    const treinosMaisFeitos = buildTreinosMaisFeitos(current);

    return {
      periodo: {
        inicio: currentWeek.start,
        fim: currentWeek.end,
        descricao: `${formatDate(currentWeek.start)} a ${formatDate(currentWeek.end)}`,
      },
      totais,
      comparativoSemanaAnterior: {
        possuiDados: previous.length > 0,
        sessoesFinalizadasVariacao:
          totais.sessoesFinalizadas - totaisSemanaAnterior.sessoesFinalizadas,
        diasTreinadosVariacao: totais.diasTreinados - totaisSemanaAnterior.diasTreinados,
        duracaoMediaMinutosVariacao: roundTo(
          totais.duracaoMediaMinutos - totaisSemanaAnterior.duracaoMediaMinutos
        ),
        taxaConclusaoMediaPercentualVariacao: roundTo(
          totais.taxaConclusaoMediaPercentual - totaisSemanaAnterior.taxaConclusaoMediaPercentual
        ),
      },
      treinosMaisFeitos,
      progressao,
    };
  }
}
