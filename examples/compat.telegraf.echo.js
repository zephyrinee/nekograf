const { Telegraf } = require("../src/index")

const bot = new Telegraf(process.env.NEKOGRAF_TOKEN || "PUT_YOUR_TOKEN_HERE")

bot.command("start", async (ctx) => {
  await ctx.reply("ok")
})

bot.action("ping", async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.editMessageCaption("pong", { parse_mode: "HTML" })
})

bot.launch()
