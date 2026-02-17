import { openai } from "./openai.client";
import { ParserPrompt } from "./prompts/parser.prompt";
import { ParserResult } from "./types/parser.types";

export class TreinoParserService {
  async parse(input: string): Promise<ParserResult> {
    const prompt = ParserPrompt(input);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Você é um parser estruturado que responde apenas JSON válido.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
    });

    const content = response.choices[0].message.content;

    if (!content) {
      return {
        success: false,
        erro: "Resposta vazia da IA.",
      };
    }

    try {
      const parsed: ParserResult = JSON.parse(content);

      if (typeof parsed.success !== "boolean") {
        throw new Error();
      }

      return parsed;
    } catch {
      return {
        success: false,
        erro: "IA retornou JSON inválido.",
      };
    }
  }
}
