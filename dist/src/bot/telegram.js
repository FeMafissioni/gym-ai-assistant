"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TELEGRAM_COMMANDS = exports.bot = void 0;
exports.registerTelegramCommands = registerTelegramCommands;
const telegraf_1 = require("telegraf");
const dotenv_1 = __importDefault(require("dotenv"));
const formatExercicio_1 = require("../helpers/formatExercicio");
const formatResumoPosTreino_1 = require("../helpers/formatResumoPosTreino");
const formatResumoSemanal_1 = require("../helpers/formatResumoSemanal");
const bot_dependencies_1 = require("./bot.dependencies");
dotenv_1.default.config();
exports.bot = new telegraf_1.Telegraf(process.env.TOKEN_BOT_TELEGRAM);
const dependencies = (0, bot_dependencies_1.createBotDependencies)();
exports.TELEGRAM_COMMANDS = [
    { command: "start", description: "inicia o bot e mostra instrucoes" },
    { command: "iniciar", description: "inicia uma sessao de treino" },
    { command: "proximo", description: "avanca para o proximo exercicio" },
    { command: "voltar", description: "retorna ao exercicio anterior" },
    { command: "finalizar", description: "finaliza a sessao ativa" },
    { command: "salvar_treino", description: "salva treinos a partir de texto" },
    { command: "resumo_semana", description: "gera o resumo semanal" },
];
async function registerTelegramCommands() {
    const commandScopes = [
        {},
        { scope: { type: "all_private_chats" } },
        { scope: { type: "all_group_chats" } },
    ];
    const languages = [undefined, "pt", "en"];
    for (const scopeExtra of commandScopes) {
        for (const languageCode of languages) {
            await exports.bot.telegram.setMyCommands(exports.TELEGRAM_COMMANDS, {
                ...scopeExtra,
                ...(languageCode ? { language_code: languageCode } : {}),
            });
        }
    }
    await exports.bot.telegram.setChatMenuButton({
        menuButton: {
            type: "commands",
        },
    });
    const registeredCommands = await exports.bot.telegram.getMyCommands();
    console.log(`Comandos do Telegram registrados: ${registeredCommands.length}`);
}
exports.bot.catch((error, ctx) => {
    console.error("Erro ao processar update do Telegram.", {
        updateType: ctx.updateType,
        userId: ctx.from?.id,
        error,
    });
});
const CMD_SALVAR_TREINO = /^(salvartreino|salvar_treino)$/i;
const CMD_RESUMO_SEMANA = /^(resumo_semana|resumosemana)$/i;
async function sendPostWorkoutSummary(ctx, userId, sessaoId) {
    try {
        const resumo = await dependencies.getResumoPosTreinoUseCase.execute({ userId, sessaoId });
        let mensagemResumo;
        try {
            mensagemResumo = await dependencies.postTreinoResumoService.generate(resumo);
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
    try {
        const nome = ctx.from.first_name;
        const user = await dependencies.saveUserUseCase.execute({
            telegramId,
            nome,
        });
        ctx.state.user = user;
    }
    catch (error) {
        console.error("Falha ao criar/atualizar usuário no banco.", {
            telegramId,
            error,
        });
        await ctx.reply("Tive um erro interno ao carregar seu perfil. Tente novamente em instantes.");
        return;
    }
    return next();
});
exports.bot.start(async (ctx) => {
    try {
        await registerTelegramCommands();
    }
    catch (error) {
        console.error("Falha ao sincronizar comandos no /start.", error);
    }
    const firstName = ctx.from?.first_name ?? "atleta";
    await ctx.reply(`Bem-vindo ao Gym-Ai-Assist, ${firstName}!` +
        "\n\nEstou aqui para te acompanhar no treino." +
        "\nPróximo passo: use o comando /iniciar para escolher seu treino de hoje. Caso ainda não tenha treinos cadastrados, envie seu treino no comando /salvar_treino");
});
exports.bot.command(CMD_SALVAR_TREINO, async (ctx) => {
    await ctx.reply("Enviando treino para o servidor...");
    const retornoIa = await dependencies.treinoParserService.parse(ctx.message.text);
    if (!retornoIa.success) {
        await ctx.reply(`Erro ao processar treino: ${retornoIa.erro}`);
        return;
    }
    try {
        await dependencies.createTreinosFromParsedJsonUseCase.execute({
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
    const treinos = await dependencies.getUserTreinosUseCase.execute({ userId });
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
    await dependencies.startSessionUseCase.execute({
        userId,
        treinoId
    });
    const exercicioAtual = await dependencies.getCurrentExercicioUseCase.execute({
        userId,
    });
    await ctx.reply((0, formatExercicio_1.formatExercicio)(exercicioAtual));
});
exports.bot.command("proximo", async (ctx) => {
    const userId = ctx.state.user.id;
    var hasOtherExercise = await dependencies.advanceExercicioUseCase.execute({ userId });
    if (hasOtherExercise.sessaoFinalizada) {
        await ctx.reply("Sessão finalizada. Parabéns! 💪");
        await sendPostWorkoutSummary(ctx, userId, hasOtherExercise.sessaoId);
        return;
    }
    const exercicioAtual = await dependencies.getCurrentExercicioUseCase.execute({ userId });
    await ctx.reply((0, formatExercicio_1.formatExercicio)(exercicioAtual));
});
exports.bot.command("voltar", async (ctx) => {
    const userId = ctx.state.user.id;
    const hasPreviousExercise = await dependencies.previousExercicioUseCase.execute({ userId });
    if (!hasPreviousExercise.hasPreviousExercicio) {
        await ctx.reply("Você já está no primeiro exercício deste treino.");
        return;
    }
    const exercicioAtual = await dependencies.getCurrentExercicioUseCase.execute({ userId });
    await ctx.reply((0, formatExercicio_1.formatExercicio)(exercicioAtual));
});
exports.bot.on("text", async (ctx, next) => {
    const userId = ctx.state.user.id;
    const texto = ctx.message.text.trim();
    if (texto.startsWith("/"))
        return next();
    const sessaoAtiva = await dependencies.getSessaoAtivaUseCase.execute({ userId });
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
        await dependencies.registerSerieUseCase.execute({
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
        const sessaoFinalizada = await dependencies.finishSessionUseCase.execute({ userId });
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
        const resumo = await dependencies.getResumoSemanalUseCase.execute({ userId });
        let mensagemResumo;
        try {
            mensagemResumo = await dependencies.resumoSemanalService.generate(resumo);
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
