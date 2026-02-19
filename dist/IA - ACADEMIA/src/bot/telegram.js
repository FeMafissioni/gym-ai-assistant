"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const dotenv_1 = __importDefault(require("dotenv"));
const parser_service_1 = require("../openai/parser.service");
const saveTreinoParseado_cases_1 = require("../cases/saveTreinoParseado/saveTreinoParseado.cases");
dotenv_1.default.config();
const bot = new telegraf_1.Telegraf(process.env.TOKEN_BOT_TELEGRAM);
const treinoParserService = new parser_service_1.TreinoParserService();
const createTreinosFromParsedJsonUseCase = new saveTreinoParseado_cases_1.CreateTreinosFromParsedJsonUseCase();
bot.start((ctx) => {
    const firstName = ctx.from?.first_name || "usuário";
    ctx.reply(`Bem-vindo ao Gym-Ai-Assist, ${firstName}!`);
});
bot.command("SalvarTreino", async (ctx) => {
    await ctx.reply("Enviando treino para o servidor...");
    const retornoIa = await treinoParserService.parse(ctx.message.text);
    if (!retornoIa.success) {
        await ctx.reply(`Erro ao processar treino: ${retornoIa.erro}`);
        return;
    }
    console.log(`Treino parseado: ${JSON.stringify(retornoIa.treinos)}`);
    try {
        await createTreinosFromParsedJsonUseCase.execute({
            userId: ctx.message.from.id.toString(),
            treinos: retornoIa.treinos,
        });
        await ctx.reply("Treino salvo com sucesso!");
    }
    catch (error) {
        await ctx.reply(`Erro ao salvar treino: ${error}`);
    }
});
bot.launch();
