const { Nekograf } = require("../src/index")

const bot = new Nekograf({ token: process.env.NEKOGRAF_TOKEN || "PUT_YOUR_TOKEN_HERE", polling: true })

bot.nekoBotOnText(/\/echo (.+)/, async (ctx, match) => {
  await ctx.reply(match[1])
})

bot.nekoBotOn("message", async (ctx) => {
  const t = ctx.message && ctx.message.text ? ctx.message.text : ""
  if (t.startsWith("/echo ")) return
  await ctx.reply("Received your message")
})

bot.nekoBotCatch(async (err) => {
  const msg = err && err.message ? err.message : String(err)
  process.stderr.write(msg + "\n")
})

bot.nekoBotStart()
