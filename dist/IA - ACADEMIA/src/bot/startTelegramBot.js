"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTelegramBot = startTelegramBot;
const telegram_1 = require("./telegram");
const RETRYABLE_STARTUP_ERROR_CODES = new Set([
    "ETIMEDOUT",
    "ECONNRESET",
    "ECONNREFUSED",
    "ECONNABORTED",
    "EAI_AGAIN",
    "ENOTFOUND",
]);
const SLOW_STARTUP_WARNING_MS = 10000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function getStartupErrorCode(error) {
    if (!error || typeof error !== "object")
        return undefined;
    const err = error;
    if (typeof err.code === "string")
        return err.code;
    if (typeof err.errno === "string")
        return err.errno;
    return undefined;
}
function isRetryableStartupError(error) {
    const code = getStartupErrorCode(error);
    return !!code && RETRYABLE_STARTUP_ERROR_CODES.has(code);
}
function registerShutdownHandlers() {
    process.once("SIGINT", () => telegram_1.bot.stop("SIGINT"));
    process.once("SIGTERM", () => telegram_1.bot.stop("SIGTERM"));
}
async function startTelegramBot() {
    registerShutdownHandlers();
    let attempt = 0;
    while (true) {
        attempt += 1;
        console.log(`Tentando conectar ao Telegram (tentativa ${attempt})...`);
        const slowStartupWarningTimer = setTimeout(() => {
            console.warn(`Conexao com Telegram ainda pendente apos ${Math.round(SLOW_STARTUP_WARNING_MS / 1000)}s (tentativa ${attempt}).`);
        }, SLOW_STARTUP_WARNING_MS);
        try {
            await telegram_1.bot.launch();
            console.log("Bot conectado ao Telegram 🚀");
            return;
        }
        catch (error) {
            if (!isRetryableStartupError(error)) {
                console.error("Falha ao iniciar o bot (erro não transitório):", error);
                throw error;
            }
            const delayMs = Math.min(30000, 2000 * attempt);
            const code = getStartupErrorCode(error) ?? "UNKNOWN";
            console.error(`Falha ao conectar no Telegram (${code}) na tentativa ${attempt}. Nova tentativa em ${Math.round(delayMs / 1000)}s.`);
            await sleep(delayMs);
        }
        finally {
            clearTimeout(slowStartupWarningTimer);
        }
    }
}
