import { Telegraf, type Context } from "telegraf";
import dotenv from "dotenv";
import { TreinoParserService } from "../openai/parser.service";
import { CreateTreinosFromParsedJsonUseCase } from "../cases/saveTreinoParseado/saveTreinoParseado.cases";
import { StartTreinoUseCase } from "../cases/startTreino/startTreino.cases";
import { GetCurrentExercicioUseCase } from "../cases/getCurrentExercicio/getCurrentExercicio.cases";
import { AdvanceExercicioUseCase } from "../cases/advanceExercicio/advanceExercicio.cases";
import { FinishSessaoUseCase } from "../cases/finishSessao/finishSessao.cases";
import { RegisterExecucaoUseCase } from "../cases/registerExecucao/registerExecucao.cases";
import { formatExercicio } from "../helpers/formatExercicio";
import { GetSessaoAtivaUseCase } from "../cases/getSessaoAtiva/getSessaoAtiva.cases";
import { GetUserTreinosUseCase } from "../cases/getUserTreinos/getUserTreinos.cases";
import { SaveUserUseCase } from "../cases/saveUser/saveUser.cases";
import { SaveUserResponse } from "../cases/saveUser/types/saveUser.types";

dotenv.config()

interface BotState {
  user: SaveUserResponse;
}

export interface BotContext extends Context {
  state: BotState;
}

export const bot = new Telegraf<BotContext>(process.env.TOKEN_BOT_TELEGRAM!)

const treinoParserService = new TreinoParserService()
const createTreinosFromParsedJsonUseCase = new CreateTreinosFromParsedJsonUseCase()
const getSessaoAtivaUseCase = new GetSessaoAtivaUseCase()
const startSessionUseCase = new StartTreinoUseCase()
const getCurrentExercicioUseCase = new GetCurrentExercicioUseCase()
const advanceExercicioUseCase = new AdvanceExercicioUseCase()
const finishSessionUseCase = new FinishSessaoUseCase()
const registerSerieUseCase = new RegisterExecucaoUseCase()
const getUserTreinosUseCase = new GetUserTreinosUseCase()
const saveUserUseCase = new SaveUserUseCase()

bot.use(async (ctx, next) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return next();

  const nome = ctx.from!.first_name;

  const user = await saveUserUseCase.execute({
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

bot.command("SalvarTreino", async (ctx) => {
  await ctx.reply("Enviando treino para o servidor...")
  const retornoIa = await treinoParserService.parse(ctx.message.text)

  if (!retornoIa.success) {
    await ctx.reply(`Erro ao processar treino: ${retornoIa.erro}`)
    return
  }
  try {
    await createTreinosFromParsedJsonUseCase.execute({
      userId: ctx.state.user.id,
      treinos: retornoIa.treinos,
    })
    await ctx.reply("Treino salvo com sucesso!")
  } catch (error) {
      await ctx.reply(`Não foi possível salvar o treino, por favor tente novamente mais tarde.`)
    }
})

bot.command("iniciar", async (ctx) => {
  const userId = ctx.state.user.id

  const treinos = await getUserTreinosUseCase.execute({ userId })

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
  await startSessionUseCase.execute({
    userId,
    treinoId
  })

  const exercicioAtual = await getCurrentExercicioUseCase.execute({
    userId, 
  })
  await ctx.reply(formatExercicio(exercicioAtual))
})

bot.command("proximo", async (ctx) => {
  const userId = ctx.state.user.id

  var hasOtherExercise = await advanceExercicioUseCase.execute({ userId })

  if (hasOtherExercise.sessaoFinalizada) {
    await finishSessionUseCase.execute({ userId });
    await ctx.reply("Sessão finalizada. Parabéns! 💪");
    return;
  }

  const exercicioAtual = await getCurrentExercicioUseCase.execute({ userId })
  
  await ctx.reply(formatExercicio(exercicioAtual))
})

bot.on("text", async (ctx, next) => {
  const userId = ctx.state.user.id

  const texto = ctx.message.text.trim()

  if (texto.startsWith("/")) return next()

  const sessaoAtiva = await getSessaoAtivaUseCase.execute({ userId })

  if (!sessaoAtiva) {
    await ctx.reply("Você não possui uma sessão ativa no momento. Inicie um treino com /iniciar.");
    return;
  }

  const match = texto.match(/^(\d+)\s+(\d+)$/)

  if (!match) return // não é formato válido

  const peso = Number(match[1])
  const repeticoes = Number(match[2])

  try {
    await registerSerieUseCase.execute({
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
    await finishSessionUseCase.execute({ userId });
    await ctx.reply("Treino finalizado. Parabéns! 💪");
  } catch (err) {
    await ctx.reply("Erro ao finalizar sessão.");
  }
});
