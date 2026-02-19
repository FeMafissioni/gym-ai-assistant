export interface AdvanceExercicioRequest {
  userId: string;
}

export interface AdvanceExercicioResult {
  sessaoId: string;
  exercicioAtual: {
    id: string;
    nome: string;
  } | null;
  sessaoFinalizada: boolean;
}
