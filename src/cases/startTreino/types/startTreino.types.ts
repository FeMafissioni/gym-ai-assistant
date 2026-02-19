export type StartTreinoRequest = {
  userId: string;
  treinoId: string;
};

export type StartTreinoData = {
  sessaoId: string;
  treinoNome: string;
  primeiroExercicio: {
    id: string;
    nome: string;
  };
}