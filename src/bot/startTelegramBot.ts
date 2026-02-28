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
const DEFAULT_WEBHOOK_PATH = "/telegram/webhook";
const DEFAULT_WEBHOOK_PORT = 3000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type BotTransport = "polling" | "webhook";

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

function getBotTransport(): BotTransport {
  const rawValue = (process.env.BOT_TRANSPORT ?? "polling").trim().toLowerCase();

  if (rawValue === "polling" || rawValue === "webhook") return rawValue;

  console.warn(`BOT_TRANSPORT inválido ("${rawValue}"). Usando "polling".`);
  return "polling";
}

function normalizeWebhookPath(path: string): string {
  const normalized = path.trim();
  if (!normalized) return DEFAULT_WEBHOOK_PATH;
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function getWebhookConfig() {
  const domain = process.env.WEBHOOK_DOMAIN?.trim();

  if (!domain) {
    throw new Error("WEBHOOK_DOMAIN é obrigatório quando BOT_TRANSPORT=webhook.");
  }

  if (!domain.startsWith("https://")) {
    throw new Error("WEBHOOK_DOMAIN deve iniciar com https://");
  }

  const webhookPath = normalizeWebhookPath(process.env.WEBHOOK_PATH ?? DEFAULT_WEBHOOK_PATH);
  const portRaw = process.env.PORT ?? process.env.WEBHOOK_PORT ?? String(DEFAULT_WEBHOOK_PORT);
  const port = Number.parseInt(portRaw, 10);

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`PORT/WEBHOOK_PORT inválido: "${portRaw}".`);
  }

  const secretToken = process.env.WEBHOOK_SECRET_TOKEN?.trim();

  return {
    domain: domain.replace(/\/+$/, ""),
    path: webhookPath,
    port,
    secretToken: secretToken ? secretToken : undefined,
  };
}

function registerShutdownHandlers() {
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

export async function startTelegramBot() {
  registerShutdownHandlers();

  const transport = getBotTransport();
  const webhookConfig = transport === "webhook" ? getWebhookConfig() : null;

  if (webhookConfig) {
    console.log(
      `Modo webhook ativo em ${webhookConfig.domain}${webhookConfig.path} (porta ${webhookConfig.port}).`
    );
  } else {
    console.log("Modo polling ativo.");
  }

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
      if (webhookConfig) {
        await bot.launch({
          webhook: {
            domain: webhookConfig.domain,
            path: webhookConfig.path,
            port: webhookConfig.port,
            secretToken: webhookConfig.secretToken,
          },
        });
      } else {
        await bot.launch();
      }

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
