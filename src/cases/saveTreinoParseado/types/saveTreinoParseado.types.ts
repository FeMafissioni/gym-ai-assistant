import { ParsedTreino } from "../../../openai/types/parser.types";

export interface CreateTreinosFromParsedJsonInput {
  userId: string;
  treinos: ParsedTreino[];
}
