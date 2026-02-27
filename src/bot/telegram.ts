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
const deps = createBotDependencies()

const CMD_SALVAR_TREINO = /^(salvartreino|salvar_treino)$/i
const CMD_RESUMO_SEMANA = /^(resumo_semana|resumosemana)$/i

async function sendPostWorkoutSummary(
  ctx: Pick<BotContext, "reply">,
  userId: string,
  sessaoId: string
) {
  try {
    const resumo = await deps.getResumoPosTreinoUseCase.execute({ userId, sessaoId })

    let mensagemResumo: string

    try {
      mensagemResumo = await deps.postTreinoResumoService.generate(resumo)
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

  const nome = ctx.from!.first_name;

  const user = await deps.saveUserUseCase.execute({
    telegramId,
    nome,
  });

  ctx.state.user = user;

  return next();
});

bot.start((ctx) => {
    const firstName = ctx.from?.first_name ?? "atleta";
    ctx.reply(
      `Bem-vindo ao Gym-Ai-Assist, ${firstName}!` +
      "\n\nEstou aqui para te acompanhar no treino." +
      "\nPróximo passo: use o comando /iniciar para escolher seu treino de hoje."
    )
})

bot.command(CMD_SALVAR_TREINO, async (ctx) => {
  await ctx.reply("Enviando treino para o servidor...")
  const retornoIa = await deps.treinoParserService.parse(ctx.message.text)

  if (!retornoIa.success) {
    await ctx.reply(`Erro ao processar treino: ${retornoIa.erro}`)
    return
  }
  try {
    await deps.createTreinosFromParsedJsonUseCase.execute({
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

  const treinos = await deps.getUserTreinosUseCase.execute({ userId })

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
  await deps.startSessionUseCase.execute({
    userId,
    treinoId
  })

  const exercicioAtual = await deps.getCurrentExercicioUseCase.execute({
    userId, 
  })
  await ctx.reply(formatExercicio(exercicioAtual))
})

bot.command("proximo", async (ctx) => {
  const userId = ctx.state.user.id

  var hasOtherExercise = await deps.advanceExercicioUseCase.execute({ userId })

  if (hasOtherExercise.sessaoFinalizada) {
    await ctx.reply("Sessão finalizada. Parabéns! 💪");
    await sendPostWorkoutSummary(ctx, userId, hasOtherExercise.sessaoId)
    return;
  }

  const exercicioAtual = await deps.getCurrentExercicioUseCase.execute({ userId })
  
  await ctx.reply(formatExercicio(exercicioAtual))
})

bot.on("text", async (ctx, next) => {
  const userId = ctx.state.user.id

  const texto = ctx.message.text.trim()

  if (texto.startsWith("/")) return next()

  const sessaoAtiva = await deps.getSessaoAtivaUseCase.execute({ userId })

  if (!sessaoAtiva) {
    await ctx.reply("Você não possui uma sessão ativa no momento. Inicie um treino com /iniciar.");
    return;
  }

  const match = texto.match(/^(\d+)\s+(\d+)$/)

  if (!match) return // não é formato válido

  const peso = Number(match[1])
  const repeticoes = Number(match[2])

  try {
    await deps.registerSerieUseCase.execute({
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
    const sessaoFinalizada = await deps.finishSessionUseCase.execute({ userId });
    await ctx.reply("Treino finalizado. Parabéns! 💪");
    await sendPostWorkoutSummary(ctx, userId, sessaoFinalizada.sessaoId)
  } catch (err) {
    await ctx.reply("Erro ao finalizar sessão.");
  }
});

bot.command(CMD_RESUMO_SEMANA, async (ctx) => {
  const userId = ctx.state.user.id;

  try {
    const resumo = await deps.getResumoSemanalUseCase.execute({ userId })
    let mensagemResumo: string

    try {
      mensagemResumo = await deps.resumoSemanalService.generate(resumo)
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
