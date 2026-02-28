"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreinoParserService = void 0;
const openai_client_1 = require("./openai.client");
const parser_prompt_1 = require("./prompts/parser.prompt");
class TreinoParserService {
    async parse(input) {
        const prompt = (0, parser_prompt_1.ParserPrompt)(input);
        const response = await openai_client_1.openai.chat.completions.create({
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
            const parsed = JSON.parse(content);
            if (typeof parsed.success !== "boolean") {
                throw new Error();
            }
            return parsed;
        }
        catch {
            return {
                success: false,
                erro: "IA retornou JSON inválido.",
            };
        }
    }
}
exports.TreinoParserService = TreinoParserService;
