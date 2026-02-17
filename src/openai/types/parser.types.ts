export interface ParsedExercise {
  nome: string;
  ordem: number;
}

export interface ParsedTreino {
  nome: string;
  exercicios: ParsedExercise[];
}

export interface ParserSuccess {
  success: true;
  treinos: ParsedTreino[];
}

export interface ParserError {
  success: false;
  erro: string;
}

export type ParserResult = ParserSuccess | ParserError;
