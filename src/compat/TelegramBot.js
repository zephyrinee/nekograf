const { Nekograf } = require("../nekograf/Nekograf")

class TelegramBot {
  constructor(token, opts) {
    const o = opts || {}
    const polling = o.polling === false ? false : true
    this.core = new Nekograf({ token, polling, pollingOptions: o.pollingOptions || {} })
  }

  onText(regex, cb) {
    this.core.nekoBotOnText(regex, async (ctx, match) => { await cb(ctx.message, match) })
    return this
  }

  on(event, cb) {
    this.core.nekoBotOn(event, async (ctx) => { await cb(ctx.message) })
    return this
  }

  sendMessage(chatId, text, extra) { return this.core.api.sendMessage(chatId, text, extra) }
  sendPhoto(chatId, photo, extra) { return this.core.api.sendPhoto(chatId, photo, extra) }
  sendDocument(chatId, document, extra) { return this.core.api.sendDocument(chatId, document, extra) }
  sendVideo(chatId, video, extra) { return this.core.api.sendVideo(chatId, video, extra) }
  sendAudio(chatId, audio, extra) { return this.core.api.sendAudio(chatId, audio, extra) }

  editMessageText(text, extra) { return this.core.api.editMessageText(Object.assign({}, extra || {}, { text })) }
  answerCallbackQuery(id, extra) { return this.core.api.answerCallbackQuery(id, extra) }

  getMe() { return this.core.api.getMe() }
  setWebHook(url, extra) { return this.core.api.setWebhook(Object.assign({}, extra || {}, { url })) }
  deleteWebHook(extra) { return this.core.api.deleteWebhook(extra || {}) }

  startPolling() { return this.core.nekoBotStart() }
  stopPolling() { return this.core.nekoBotStop() }
}

module.exports = { TelegramBot }
