export interface GetListTreinosRequest {
  userId: string;
}

export interface GetListTreinosResponse {
  treinos: GetListTreinosData[];
}

export interface GetListTreinosData {
  treinoId: string;
  nome: string;
}
