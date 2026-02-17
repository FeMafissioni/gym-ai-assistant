import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { TreinoParserService } from "../openai/parser.service";
import { CreateTreinosFromParsedJsonUseCase } from "../cases/saveTreinoParseado.cases";

dotenv.config()

const bot = new Telegraf(process.env.TOKEN_BOT_TELEGRAM!)
const treinoParserService = new TreinoParserService()
const createTreinosFromParsedJsonUseCase = new CreateTreinosFromParsedJsonUseCase()

bot.start((ctx) => {
    const firstName = ctx.from?.first_name || "usuário";
    ctx.reply(`Bem-vindo ao Gym-Ai-Assist, ${firstName}!`)
})

bot.command("SalvarTreino", async (ctx) => {
  await ctx.reply("Enviando treino para o servidor...")
  const retornoIa = await treinoParserService.parse(ctx.message.text)

  if (!retornoIa.success) {
    await ctx.reply(`Erro ao processar treino: ${retornoIa.erro}`)
    return
  }
  console.log(`Treino parseado: ${JSON.stringify(retornoIa.treinos)}`)
  try {
    await createTreinosFromParsedJsonUseCase.execute({
      userId: ctx.message.from.id.toString(),
      treinos: retornoIa.treinos,
    })
    await ctx.reply("Treino salvo com sucesso!")
  } catch (error) {
      await ctx.reply(`Erro ao salvar treino: ${error}`)
    }
})


bot.launch()