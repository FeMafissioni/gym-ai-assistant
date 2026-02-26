import { openai } from "./openai.client";
import { PostTreinoResumoPrompt } from "./prompts/postTreinoResumo.prompt";
import { GetResumoPosTreinoResult } from "../cases/getResumoPosTreino/types/getResumoPosTreino.types";

export class PostTreinoResumoService {
  async generate(resumo: GetResumoPosTreinoResult): Promise<string> {
    const prompt = PostTreinoResumoPrompt(resumo);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você resume treinos com base em dados estruturados e não inventa informações.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content?.trim();

    if (!content) {
      throw new Error("Resposta vazia da IA para resumo pós-treino.");
    }

    return content;
  }
}

