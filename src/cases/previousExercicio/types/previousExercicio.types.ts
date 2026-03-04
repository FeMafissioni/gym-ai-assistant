export interface PreviousExercicioRequest {
  userId: string;
}

export interface PreviousExercicioResult {
  sessaoId: string;
  exercicioAtual: {
    id: string;
    nome: string;
  } | null;
  hasPreviousExercicio: boolean;
}
