"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const bot = new telegraf_1.Telegraf(process.env.TOKEN_BOT_TELEGRAM);
bot.start((ctx) => ctx.reply('Welcome'));
