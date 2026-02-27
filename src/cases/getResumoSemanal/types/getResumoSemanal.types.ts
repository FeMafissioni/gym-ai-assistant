export interface GetResumoSemanalRequest {
  userId: string;
  referenceDate?: Date;
}

export interface ResumoSemanalSnapshot {
  peso: number;
  repeticoes: number;
  score: number;
  finalizadoEm: Date;
}

export interface ResumoSemanalDestaqueExercicio {
  exercicioId: string;
  exercicioNome: string;
  sessoesNoPeriodo: number;
  primeiro: ResumoSemanalSnapshot;
  ultimo: ResumoSemanalSnapshot;
  variacaoPeso: number;
  variacaoRepeticoes: number;
  variacaoScore: number;
}

export interface ResumoSemanalTreinoFrequencia {
  treinoId: string;
  treinoNome: string;
  totalSessoes: number;
}

export interface ResumoSemanalBasico {
  sessoesFinalizadas: number;
  diasTreinados: number;
  duracaoMediaMinutos: number;
  exerciciosRegistrados: number;
  exerciciosPlanejados: number;
  taxaConclusaoMediaPercentual: number;
}

export interface GetResumoSemanalResult {
  periodo: {
    inicio: Date;
    fim: Date;
    descricao: string;
  };
  totais: ResumoSemanalBasico;
  comparativoSemanaAnterior: {
    possuiDados: boolean;
    sessoesFinalizadasVariacao: number;
    diasTreinadosVariacao: number;
    duracaoMediaMinutosVariacao: number;
    taxaConclusaoMediaPercentualVariacao: number;
  };
  treinosMaisFeitos: ResumoSemanalTreinoFrequencia[];
  progressao: {
    exerciciosComHistorico: number;
    melhoras: number;
    estagnados: number;
    quedas: number;
    melhores: ResumoSemanalDestaqueExercicio[];
    quedasDetalhes: ResumoSemanalDestaqueExercicio[];
  };
}

