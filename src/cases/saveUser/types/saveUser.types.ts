export interface SaveUserRequest {
  telegramId: string;
  nome: string;
}

export interface SaveUserResponse {
  id: string; 
  telegramId: string;
  nome: string;
  created: boolean;
}