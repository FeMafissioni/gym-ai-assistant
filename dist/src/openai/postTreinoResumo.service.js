"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostTreinoResumoService = void 0;
const openai_client_1 = require("./openai.client");
const postTreinoResumo_prompt_1 = require("./prompts/postTreinoResumo.prompt");
class PostTreinoResumoService {
    async generate(resumo) {
        const prompt = (0, postTreinoResumo_prompt_1.PostTreinoResumoPrompt)(resumo);
        const response = await openai_client_1.openai.chat.completions.create({
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
exports.PostTreinoResumoService = PostTreinoResumoService;
