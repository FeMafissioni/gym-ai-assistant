export interface GetResumoPosTreinoRequest {
  userId: string;
  sessaoId: string;
}

export interface ResumoPosTreinoExecucao {
  peso: number;
  repeticoes: number;
  score: number;
}

export type ResumoComparativoStatus =
  | "MELHOROU"
  | "MANTEVE"
  | "PIOROU"
  | "SEM_HISTORICO";

export interface ResumoPosTreinoExercicio {
  exercicioId: string;
  exercicioNome: string;
  ordem: number;
  registrado: boolean;
  status?: ResumoComparativoStatus;
  atual?: ResumoPosTreinoExecucao;
  anterior?: ResumoPosTreinoExecucao;
  variacao?: {
    peso: number;
    repeticoes: number;
    score: number;
  };
}

export interface ResumoPosTreinoDestaque {
  exercicioNome: string;
  variacaoPeso: number;
  variacaoRepeticoes: number;
  variacaoScore: number;
  atual: {
    peso: number;
    repeticoes: number;
  };
  anterior: {
    peso: number;
    repeticoes: number;
  };
}

export interface GetResumoPosTreinoResult {
  treino: {
    id: string;
    nome: string;
  };
  sessao: {
    id: string;
    iniciadoEm: Date;
    finalizadoEm: Date;
    duracaoMinutos: number;
  };
  totais: {
    exerciciosPlanejados: number;
    exerciciosRegistrados: number;
    exerciciosSemRegistro: number;
    taxaConclusaoPercentual: number;
  };
  comparativo: {
    possuiHistoricoAnterior: boolean;
    melhorou: number;
    manteve: number;
    piorou: number;
    semHistorico: number;
    exercicios: ResumoPosTreinoExercicio[];
  };
  destaques: {
    melhores: ResumoPosTreinoDestaque[];
    quedas: ResumoPosTreinoDestaque[];
  };
}

