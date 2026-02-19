export type StartTreinoRequest = {
  userId: string;
  nomeTreino: string;
};

export type StartTreinoData = {
  sessionId: string;
  treinoNome: string;
  primeiroExercicio: {
    id: string;
    nome: string;
  };
}