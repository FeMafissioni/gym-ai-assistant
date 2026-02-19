export interface RegisterExecucaoRequest {
  userId: string;
  peso: number;
  repeticoes: number;
}

export interface RegisterExecucaoResult {
  exercicioAtual: {
    id: string;
    nome: string;
  };
}