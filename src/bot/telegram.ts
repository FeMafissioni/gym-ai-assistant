import { Telegraf, type Context } from "telegraf";
import dotenv from "dotenv";
import { SaveUserResponse } from "../cases/saveUser/types/saveUser.types";
import { formatExercicio } from "../helpers/formatExercicio";
import { formatResumoPosTreino } from "../helpers/formatResumoPosTreino";
import { formatResumoSemanal } from "../helpers/formatResumoSemanal";
import { createBotDependencies } from "./bot.dependencies";

dotenv.config()

interface BotState {
  user: SaveUserResponse;
}

export interface BotContext extends Context {
  state: BotState;
}

export const bot = new Telegraf<BotContext>(process.env.TOKEN_BOT_TELEGRAM!)
const dependencies = createBotDependencies()

export const TELEGRAM_COMMANDS = [
  { command: "start", description: "inicia o bot e mostra instrucoes" },
  { command: "iniciar", description: "inicia uma sessao de treino" },
  { command: "proximo", description: "avanca para o proximo exercicio" },
  { command: "voltar", description: "retorna ao exercicio anterior" },
  { command: "finalizar", description: "finaliza a sessao ativa" },
  { command: "salvar_treino", description: "salva treinos a partir de texto" },
  { command: "resumo_semana", description: "gera o resumo semanal" },
] as const

export async function registerTelegramCommands() {
  const commandScopes = [
    {},
    { scope: { type: "all_private_chats" as const } },
    { scope: { type: "all_group_chats" as const } },
  ]
  const languages = [undefined, "pt", "en"]

  for (const scopeExtra of commandScopes) {
    for (const languageCode of languages) {
      await bot.telegram.setMyCommands(TELEGRAM_COMMANDS, {
        ...scopeExtra,
        ...(languageCode ? { language_code: languageCode } : {}),
      })
    }
  }

  await bot.telegram.setChatMenuButton({
    menuButton: {
      type: "commands",
    },
  })

  const registeredCommands = await bot.telegram.getMyCommands()
  console.log(`Comandos do Telegram registrados: ${registeredCommands.length}`)
}

bot.catch((error, ctx) => {
  console.error("Erro ao processar update do Telegram.", {
    updateType: ctx.updateType,
    userId: ctx.from?.id,
    error,
  })
})

const CMD_SALVAR_TREINO = /^(salvartreino|salvar_treino)$/i
const CMD_RESUMO_SEMANA = /^(resumo_semana|resumosemana)$/i

async function sendPostWorkoutSummary(
  ctx: Pick<BotContext, "reply">,
  userId: string,
  sessaoId: string
) {
  try {
    const resumo = await dependencies.getResumoPosTreinoUseCase.execute({ userId, sessaoId })

    let mensagemResumo: string

    try {
      mensagemResumo = await dependencies.postTreinoResumoService.generate(resumo)
    } catch (error) {
      console.error("Falha ao gerar resumo com IA. Enviando fallback determinístico.", error)
      mensagemResumo = formatResumoPosTreino(resumo)
    }

    await ctx.reply(mensagemResumo)
  } catch (error) {
    console.error("Falha ao gerar resumo pós-treino.", error)
  }
}

bot.use(async (ctx, next) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return next();

  try {
    const nome = ctx.from!.first_name;

    const user = await dependencies.saveUserUseCase.execute({
      telegramId,
      nome,
    });

    ctx.state.user = user;
  } catch (error) {
    console.error("Falha ao criar/atualizar usuário no banco.", {
      telegramId,
      error,
    })
    await ctx.reply("Tive um erro interno ao carregar seu perfil. Tente novamente em instantes.")
    return
  }

  return next();
});

bot.start(async (ctx) => {
    try {
      await registerTelegramCommands()
    } catch (error) {
      console.error("Falha ao sincronizar comandos no /start.", error)
    }

    const firstName = ctx.from?.first_name ?? "atleta";
    await ctx.reply(
      `Bem-vindo ao Gym-Ai-Assist, ${firstName}!` +
      "\n\nEstou aqui para te acompanhar no treino." +
      "\nPróximo passo: use o comando /iniciar para escolher seu treino de hoje. Caso ainda não tenha treinos cadastrados, envie seu treino no comando /salvar_treino"
    )
})

bot.command(CMD_SALVAR_TREINO, async (ctx) => {
  await ctx.reply("Enviando treino para o servidor...")
  const retornoIa = await dependencies.treinoParserService.parse(ctx.message.text)

  if (!retornoIa.success) {
    await ctx.reply(`Erro ao processar treino: ${retornoIa.erro}`)
    return
  }
  try {
    await dependencies.createTreinosFromParsedJsonUseCase.execute({
      userId: ctx.state.user.id,
      treinos: retornoIa.treinos,
    })
    await ctx.reply("Treino salvo com sucesso!")
  } catch (error) {
      console.log("Erro ao salvar treino:", error)
      await ctx.reply(`Não foi possível salvar o treino, por favor tente novamente mais tarde.`)
    }
})

bot.command("iniciar", async (ctx) => {
  const userId = ctx.state.user.id

  const treinos = await dependencies.getUserTreinosUseCase.execute({ userId })

  if (!treinos.treinos.length) {
    await ctx.reply("Você ainda não possui treinos cadastrados.")
    return
  }

  await ctx.reply(
    "Escolha o treino de hoje:",
    {
      reply_markup: {
        inline_keyboard: treinos.treinos.map(t => [
          {
            text: t.nome,
            callback_data: `INICIAR_TREINO_${t.treinoId}`
          }
        ])
      }
    }
  )
})

bot.action(/INICIAR_TREINO_(.+)/, async (ctx) => {
  const userId = ctx.state.user.id
  const treinoId = ctx.match[1]

  //Sessão iniciada
  await dependencies.startSessionUseCase.execute({
    userId,
    treinoId
  })

  const exercicioAtual = await dependencies.getCurrentExercicioUseCase.execute({
    userId, 
  })
  await ctx.reply(formatExercicio(exercicioAtual))
})

bot.command("proximo", async (ctx) => {
  const userId = ctx.state.user.id

  var hasOtherExercise = await dependencies.advanceExercicioUseCase.execute({ userId })

  if (hasOtherExercise.sessaoFinalizada) {
    await ctx.reply("Sessão finalizada. Parabéns! 💪");
    await sendPostWorkoutSummary(ctx, userId, hasOtherExercise.sessaoId)
    return;
  }

  const exercicioAtual = await dependencies.getCurrentExercicioUseCase.execute({ userId })
  
  await ctx.reply(formatExercicio(exercicioAtual))
})

bot.command("voltar", async (ctx) => {
  const userId = ctx.state.user.id

  const hasPreviousExercise = await dependencies.previousExercicioUseCase.execute({ userId })

  if (!hasPreviousExercise.hasPreviousExercicio) {
    await ctx.reply("Você já está no primeiro exercício deste treino.")
    return
  }

  const exercicioAtual = await dependencies.getCurrentExercicioUseCase.execute({ userId })

  await ctx.reply(formatExercicio(exercicioAtual))
})

bot.on("text", async (ctx, next) => {
  const userId = ctx.state.user.id

  const texto = ctx.message.text.trim()

  if (texto.startsWith("/")) return next()

  const sessaoAtiva = await dependencies.getSessaoAtivaUseCase.execute({ userId })

  if (!sessaoAtiva) {
    await ctx.reply("Você não possui uma sessão ativa no momento. Inicie um treino com /iniciar.");
    return;
  }

  const match = texto.match(/^(\d+)\s+(\d+)$/)

  if (!match) return // não é formato válido

  const peso = Number(match[1])
  const repeticoes = Number(match[2])

  try {
    await dependencies.registerSerieUseCase.execute({
      userId,
      peso,
      repeticoes,
    })

    await ctx.reply("Série registrada ✅")

  } catch (err) {
    await ctx.reply("Erro ao registrar série.")
  }
})

bot.command("finalizar", async (ctx) => {
  const userId = ctx.state.user.id;
  try {
    const sessaoFinalizada = await dependencies.finishSessionUseCase.execute({ userId });
    await ctx.reply("Treino finalizado. Parabéns! 💪");
    await sendPostWorkoutSummary(ctx, userId, sessaoFinalizada.sessaoId)
  } catch (err) {
    await ctx.reply("Erro ao finalizar sessão.");
  }
});

bot.command(CMD_RESUMO_SEMANA, async (ctx) => {
  const userId = ctx.state.user.id;

  try {
    const resumo = await dependencies.getResumoSemanalUseCase.execute({ userId })
    let mensagemResumo: string

    try {
      mensagemResumo = await dependencies.resumoSemanalService.generate(resumo)
    } catch (error) {
      console.error("Falha ao gerar resumo semanal com IA. Enviando fallback determinístico.", error)
      mensagemResumo = formatResumoSemanal(resumo)
    }

    await ctx.reply(mensagemResumo)
  } catch (error) {
    console.error("Falha ao gerar resumo semanal.", error)
    await ctx.reply("Não foi possível gerar o resumo semanal agora. Tente novamente em instantes.")
  }
});
