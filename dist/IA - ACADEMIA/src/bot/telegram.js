"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const dotenv_1 = __importDefault(require("dotenv"));
const parser_service_1 = require("../openai/parser.service");
const saveTreinoParseado_cases_1 = require("../cases/saveTreinoParseado/saveTreinoParseado.cases");
const startTreino_cases_1 = require("../cases/startTreino/startTreino.cases");
const getCurrentExercicio_cases_1 = require("../cases/getCurrentExercicio/getCurrentExercicio.cases");
const advanceExercicio_cases_1 = require("../cases/advanceExercicio/advanceExercicio.cases");
const finishSessao_cases_1 = require("../cases/finishSessao/finishSessao.cases");
const registerExecucao_cases_1 = require("../cases/registerExecucao/registerExecucao.cases");
const formatExercicio_1 = require("../helpers/formatExercicio");
const getSessaoAtiva_cases_1 = require("../cases/getSessaoAtiva/getSessaoAtiva.cases");
const getUserTreinos_cases_1 = require("../cases/getUserTreinos/getUserTreinos.cases");
const saveUser_cases_1 = require("../cases/saveUser/saveUser.cases");
dotenv_1.default.config();
const bot = new telegraf_1.Telegraf(process.env.TOKEN_BOT_TELEGRAM);
const treinoParserService = new parser_service_1.TreinoParserService();
const createTreinosFromParsedJsonUseCase = new saveTreinoParseado_cases_1.CreateTreinosFromParsedJsonUseCase();
const getSessaoAtivaUseCase = new getSessaoAtiva_cases_1.GetSessaoAtivaUseCase();
const startSessionUseCase = new startTreino_cases_1.StartTreinoUseCase();
const getCurrentExercicioUseCase = new getCurrentExercicio_cases_1.GetCurrentExercicioUseCase();
const advanceExercicioUseCase = new advanceExercicio_cases_1.AdvanceExercicioUseCase();
const finishSessionUseCase = new finishSessao_cases_1.FinishSessaoUseCase();
const registerSerieUseCase = new registerExecucao_cases_1.RegisterExecucaoUseCase();
const getUserTreinosUseCase = new getUserTreinos_cases_1.GetUserTreinosUseCase();
const saveUserUseCase = new saveUser_cases_1.SaveUserUseCase();
bot.use(async (ctx, next) => {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId)
        return next();
    const nome = ctx.from.first_name;
    const user = await saveUserUseCase.execute({
        telegramId,
        nome,
    });
    ctx.state.user = user;
    return next();
});
bot.start((ctx) => {
    const firstName = ctx.from?.first_name ?? "atleta";
    ctx.reply(`Bem-vindo ao Gym-Ai-Assist, ${firstName}!` +
        "\n\nEstou aqui para te acompanhar no treino." +
        "\nPróximo passo: use o comando /iniciar para escolher seu treino de hoje.");
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
            userId: ctx.state.user.id,
            treinos: retornoIa.treinos,
        });
        await ctx.reply("Treino salvo com sucesso!");
    }
    catch (error) {
        await ctx.reply(`Erro ao salvar treino: ${error}`);
    }
});
bot.command("iniciar", async (ctx) => {
    const userId = ctx.state.user.id;
    console.log("Iniciando treino para usuário:", userId);
    const treinos = await getUserTreinosUseCase.execute({ userId });
    if (!treinos.treinos.length) {
        await ctx.reply("Você ainda não possui treinos cadastrados.");
        return;
    }
    await ctx.reply("Escolha o treino de hoje:", {
        reply_markup: {
            inline_keyboard: treinos.treinos.map(t => [
                {
                    text: t.nome,
                    callback_data: `INICIAR_TREINO_${t.treinoId}`
                }
            ])
        }
    });
});
bot.action(/INICIAR_TREINO_(.+)/, async (ctx) => {
    const userId = ctx.state.user.id;
    const treinoId = ctx.match[1];
    //Sessão iniciada
    await startSessionUseCase.execute({
        userId,
        treinoId
    });
    const exercicioAtual = await getCurrentExercicioUseCase.execute({
        userId,
    });
    console.log("Exercício atual:", exercicioAtual);
    await ctx.reply((0, formatExercicio_1.formatExercicio)(exercicioAtual));
});
bot.command("proximo", async (ctx) => {
    const userId = ctx.state.user.id;
    console.log("Avançando exercício para usuário:", userId);
    await advanceExercicioUseCase.execute({ userId });
    const exercicioAtual = await getCurrentExercicioUseCase.execute({ userId });
    await ctx.reply((0, formatExercicio_1.formatExercicio)(exercicioAtual));
});
bot.on("text", async (ctx, next) => {
    const userId = ctx.state.user.id;
    const texto = ctx.message.text.trim();
    if (texto.startsWith("/"))
        return next();
    const sessaoAtiva = await getSessaoAtivaUseCase.execute({ userId });
    if (!sessaoAtiva) {
        await ctx.reply("Você não possui uma sessão ativa no momento. Inicie um treino com /iniciar.");
        return;
    }
    const match = texto.match(/^(\d+)\s+(\d+)$/);
    if (!match)
        return; // não é formato válido
    const peso = Number(match[1]);
    const repeticoes = Number(match[2]);
    try {
        await registerSerieUseCase.execute({
            userId,
            peso,
            repeticoes,
        });
        await ctx.reply("Série registrada ✅");
    }
    catch (err) {
        await ctx.reply("Erro ao registrar série.");
    }
});
bot.command("finalizar", async (ctx) => {
    const userId = ctx.state.user.id;
    try {
        await finishSessionUseCase.execute({ userId });
        await ctx.reply("Treino finalizado. Parabéns! 💪");
    }
    catch (err) {
        await ctx.reply("Erro ao finalizar sessão.");
    }
});
bot.launch();
