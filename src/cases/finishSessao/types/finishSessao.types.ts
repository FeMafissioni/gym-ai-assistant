export interface FinishSessaoRequest {
  userId: string;
}

export interface FinishSessaoResult {
  sessaoId: string;
  finalizadaEm: Date;
}
