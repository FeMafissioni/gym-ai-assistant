export interface GetCurrentExercicioRequest {
  userId: string;
}

export interface GetCurrentExercicioResult {
  id: string;
  nome: string;
  order: number;
  pesoUltimoRegistro?: number;
  repUltimoRegistro?: number
}
