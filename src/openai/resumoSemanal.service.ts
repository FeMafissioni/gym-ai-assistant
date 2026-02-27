import { GetResumoSemanalResult } from "../cases/getResumoSemanal/types/getResumoSemanal.types";
import { openai } from "./openai.client";
import { ResumoSemanalPrompt } from "./prompts/resumoSemanal.prompt";

export class ResumoSemanalService {
  async generate(resumo: GetResumoSemanalResult): Promise<string> {
    const prompt = ResumoSemanalPrompt(resumo);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você resume dados semanais de treino sem inventar informações.",
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
      throw new Error("Resposta vazia da IA para resumo semanal.");
    }

    return content;
  }
}

