export interface GetCurrentExercicioRequest {
  userId: string;
}

export interface GetCurrentExercicioResult {
  sessaoId: string;
  exercicio: {
    id: string;
    nome: string;
    order: number;
  };
}
