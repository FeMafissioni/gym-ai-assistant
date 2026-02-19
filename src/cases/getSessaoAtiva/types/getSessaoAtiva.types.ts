export interface GetActiveSessionRequest {
  userId: string;
}

export interface ActiveSessionData {
  sessionId: string;
  treinoId: string;
  treinoNome: string;
  exercicioAtualId: string | null;
  dataFinalizado?: Date;
}
