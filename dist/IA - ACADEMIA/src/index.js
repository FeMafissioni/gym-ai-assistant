"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const startTelegramBot_1 = require("./bot/startTelegramBot");
console.log("Inicializando bot...");
void (0, startTelegramBot_1.startTelegramBot)().catch((error) => {
    console.error("Encerrando aplicação após falha na inicialização do bot.", error);
    process.exit(1);
});
