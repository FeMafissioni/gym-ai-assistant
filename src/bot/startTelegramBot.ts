import { bot } from "./telegram";

const RETRYABLE_STARTUP_ERROR_CODES = new Set([
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "ECONNABORTED",
  "EAI_AGAIN",
  "ENOTFOUND",
]);
const SLOW_STARTUP_WARNING_MS = 10_000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function getStartupErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;

  const err = error as { code?: unknown; errno?: unknown };

  if (typeof err.code === "string") return err.code;
  if (typeof err.errno === "string") return err.errno;

  return undefined;
}

function isRetryableStartupError(error: unknown): boolean {
  const code = getStartupErrorCode(error);
  return !!code && RETRYABLE_STARTUP_ERROR_CODES.has(code);
}

function registerShutdownHandlers() {
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

export async function startTelegramBot() {
  registerShutdownHandlers();

  let attempt = 0;

  while (true) {
    attempt += 1;
    console.log(`Tentando conectar ao Telegram (tentativa ${attempt})...`);

    const slowStartupWarningTimer = setTimeout(() => {
      console.warn(
        `Conexao com Telegram ainda pendente apos ${Math.round(SLOW_STARTUP_WARNING_MS / 1000)}s (tentativa ${attempt}).`
      );
    }, SLOW_STARTUP_WARNING_MS);

    try {
      await bot.launch();
      return;
    } catch (error) {
      if (!isRetryableStartupError(error)) {
        console.error("Falha ao iniciar o bot (erro não transitório):", error);
        throw error;
      }

      const delayMs = Math.min(30_000, 2_000 * attempt);
      const code = getStartupErrorCode(error) ?? "UNKNOWN";

      console.error(
        `Falha ao conectar no Telegram (${code}) na tentativa ${attempt}. Nova tentativa em ${Math.round(delayMs / 1000)}s.`
      );

      await sleep(delayMs);
    } finally {
      clearTimeout(slowStartupWarningTimer);
    }
  }
}
