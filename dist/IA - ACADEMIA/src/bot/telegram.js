"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const telegraf_1 = require("telegraf");
const dotenv_1 = __importDefault(require("dotenv"));
const formatExercicio_1 = require("../helpers/formatExercicio");
const formatResumoPosTreino_1 = require("../helpers/formatResumoPosTreino");
const formatResumoSemanal_1 = require("../helpers/formatResumoSemanal");
const bot_dependencies_1 = require("./bot.dependencies");
dotenv_1.default.config();
exports.bot = new telegraf_1.Telegraf(process.env.TOKEN_BOT_TELEGRAM);
const deps = (0, bot_dependencies_1.createBotDependencies)();
const CMD_SALVAR_TREINO = /^(salvartreino|salvar_treino)$/i;
const CMD_RESUMO_SEMANA = /^(resumo_semana|resumosemana)$/i;
async function sendPostWorkoutSummary(ctx, userId, sessaoId) {
    try {
        const resumo = await deps.getResumoPosTreinoUseCase.execute({ userId, sessaoId });
        let mensagemResumo;
        try {
            mensagemResumo = await deps.postTreinoResumoService.generate(resumo);
        }
        catch (error) {
            console.error("Falha ao gerar resumo com IA. Enviando fallback determinístico.", error);
            mensagemResumo = (0, formatResumoPosTreino_1.formatResumoPosTreino)(resumo);
        }
        await ctx.reply(mensagemResumo);
    }
    catch (error) {
        console.error("Falha ao gerar resumo pós-treino.", error);
    }
}
exports.bot.use(async (ctx, next) => {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId)
        return next();
    const nome = ctx.from.first_name;
    const user = await deps.saveUserUseCase.execute({
        telegramId,
        nome,
    });
    ctx.state.user = user;
    return next();
});
exports.bot.start((ctx) => {
    const firstName = ctx.from?.first_name ?? "atleta";
    ctx.reply(`Bem-vindo ao Gym-Ai-Assist, ${firstName}!` +
        "\n\nEstou aqui para te acompanhar no treino." +
        "\nPróximo passo: use o comando /iniciar para escolher seu treino de hoje.");
});
exports.bot.command(CMD_SALVAR_TREINO, async (ctx) => {
    await ctx.reply("Enviando treino para o servidor...");
    const retornoIa = await deps.treinoParserService.parse(ctx.message.text);
    if (!retornoIa.success) {
        await ctx.reply(`Erro ao processar treino: ${retornoIa.erro}`);
        return;
    }
    try {
        await deps.createTreinosFromParsedJsonUseCase.execute({
            userId: ctx.state.user.id,
            treinos: retornoIa.treinos,
        });
        await ctx.reply("Treino salvo com sucesso!");
    }
    catch (error) {
        console.log("Erro ao salvar treino:", error);
        await ctx.reply(`Não foi possível salvar o treino, por favor tente novamente mais tarde.`);
    }
});
exports.bot.command("iniciar", async (ctx) => {
    const userId = ctx.state.user.id;
    const treinos = await deps.getUserTreinosUseCase.execute({ userId });
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
exports.bot.action(/INICIAR_TREINO_(.+)/, async (ctx) => {
    const userId = ctx.state.user.id;
    const treinoId = ctx.match[1];
    //Sessão iniciada
    await deps.startSessionUseCase.execute({
        userId,
        treinoId
    });
    const exercicioAtual = await deps.getCurrentExercicioUseCase.execute({
        userId,
    });
    await ctx.reply((0, formatExercicio_1.formatExercicio)(exercicioAtual));
});
exports.bot.command("proximo", async (ctx) => {
    const userId = ctx.state.user.id;
    var hasOtherExercise = await deps.advanceExercicioUseCase.execute({ userId });
    if (hasOtherExercise.sessaoFinalizada) {
        await ctx.reply("Sessão finalizada. Parabéns! 💪");
        await sendPostWorkoutSummary(ctx, userId, hasOtherExercise.sessaoId);
        return;
    }
    const exercicioAtual = await deps.getCurrentExercicioUseCase.execute({ userId });
    await ctx.reply((0, formatExercicio_1.formatExercicio)(exercicioAtual));
});
exports.bot.on("text", async (ctx, next) => {
    const userId = ctx.state.user.id;
    const texto = ctx.message.text.trim();
    if (texto.startsWith("/"))
        return next();
    const sessaoAtiva = await deps.getSessaoAtivaUseCase.execute({ userId });
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
        await deps.registerSerieUseCase.execute({
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
exports.bot.command("finalizar", async (ctx) => {
    const userId = ctx.state.user.id;
    try {
        const sessaoFinalizada = await deps.finishSessionUseCase.execute({ userId });
        await ctx.reply("Treino finalizado. Parabéns! 💪");
        await sendPostWorkoutSummary(ctx, userId, sessaoFinalizada.sessaoId);
    }
    catch (err) {
        await ctx.reply("Erro ao finalizar sessão.");
    }
});
exports.bot.command(CMD_RESUMO_SEMANA, async (ctx) => {
    const userId = ctx.state.user.id;
    try {
        const resumo = await deps.getResumoSemanalUseCase.execute({ userId });
        let mensagemResumo;
        try {
            mensagemResumo = await deps.resumoSemanalService.generate(resumo);
        }
        catch (error) {
            console.error("Falha ao gerar resumo semanal com IA. Enviando fallback determinístico.", error);
            mensagemResumo = (0, formatResumoSemanal_1.formatResumoSemanal)(resumo);
        }
        await ctx.reply(mensagemResumo);
    }
    catch (error) {
        console.error("Falha ao gerar resumo semanal.", error);
        await ctx.reply("Não foi possível gerar o resumo semanal agora. Tente novamente em instantes.");
    }
});
