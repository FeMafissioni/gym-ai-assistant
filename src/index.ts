import { startTelegramBot } from "./bot/startTelegramBot"

console.log("Inicializando bot...")

void startTelegramBot().catch((error) => {
  console.error("Encerrando aplicação após falha na inicialização do bot.", error);
  process.exit(1);
})
