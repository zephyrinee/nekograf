const { TelegramBot } = require("../src/index")

const token = process.env.NEKOGRAF_TOKEN || "PUT_YOUR_TOKEN_HERE"
const bot = new TelegramBot(token, { polling: true })

bot.onText(/\/echo (.+)/, (msg, match) => {
  bot.sendMessage(msg.chat.id, match[1])
})

bot.on("message", (msg) => {
  bot.sendMessage(msg.chat.id, "Received your message")
})

bot.startPolling()
