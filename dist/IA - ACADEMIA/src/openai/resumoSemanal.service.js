"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumoSemanalService = void 0;
const openai_client_1 = require("./openai.client");
const resumoSemanal_prompt_1 = require("./prompts/resumoSemanal.prompt");
class ResumoSemanalService {
    async generate(resumo) {
        const prompt = (0, resumoSemanal_prompt_1.ResumoSemanalPrompt)(resumo);
        const response = await openai_client_1.openai.chat.completions.create({
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
exports.ResumoSemanalService = ResumoSemanalService;
