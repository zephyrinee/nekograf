class Context {
  constructor({ update, api }) {
    this.update = update
    this.api = api
    this.state = {}
    this.session = null
  }

  get telegram() {
    return this.api.telegraf
  }

  get message() {
    return this.update.message || this.update.edited_message || this.update.channel_post || null
  }

  get callbackQuery() {
    return this.update.callback_query || null
  }

  get inlineQuery() {
    return this.update.inline_query || null
  }

  get chat() {
    const m = this.message
    if (m && m.chat) return m.chat
    const cq = this.callbackQuery
    if (cq && cq.message && cq.message.chat) return cq.message.chat
    return null
  }

  get from() {
    const m = this.message
    if (m && m.from) return m.from
    const cq = this.callbackQuery
    if (cq && cq.from) return cq.from
    const iq = this.inlineQuery
    if (iq && iq.from) return iq.from
    return null
  }

  get chatId() {
    const c = this.chat
    return c ? c.id : null
  }

  async reply(text, extra) {
    const chatId = this.chatId
    if (chatId === null || chatId === undefined) throw new Error("chat not found for reply")
    return await this.api.sendMessage(chatId, text, extra)
  }

  async sendMessage(chatId, text, extra) {
    return await this.api.sendMessage(chatId, text, extra)
  }

  async replyWithPhoto(photo, extra) {
    const chatId = this.chatId
    if (chatId === null || chatId === undefined) throw new Error("chat not found for replyWithPhoto")
    return await this.api.sendPhoto(chatId, photo, extra)
  }

  async replyWithDocument(document, extra) {
    const chatId = this.chatId
    if (chatId === null || chatId === undefined) throw new Error("chat not found for replyWithDocument")
    return await this.api.sendDocument(chatId, document, extra)
  }

  async replyWithVideo(video, extra) {
    const chatId = this.chatId
    if (chatId === null || chatId === undefined) throw new Error("chat not found for replyWithVideo")
    return await this.api.sendVideo(chatId, video, extra)
  }

  async replyWithAudio(audio, extra) {
    const chatId = this.chatId
    if (chatId === null || chatId === undefined) throw new Error("chat not found for replyWithAudio")
    return await this.api.sendAudio(chatId, audio, extra)
  }

  async editMessageCaption(caption, extra) {
    const chatId = this.chatId
    const messageId = this.callbackQuery && this.callbackQuery.message ? this.callbackQuery.message.message_id : (this.message ? this.message.message_id : undefined)
    return await this.telegram.editMessageCaption(chatId, messageId, undefined, caption, extra || {})
  }

  async editMessageMedia(media, extra) {
    const chatId = this.chatId
    const messageId = this.callbackQuery && this.callbackQuery.message ? this.callbackQuery.message.message_id : (this.message ? this.message.message_id : undefined)
    return await this.telegram.editMessageMedia(chatId, messageId, undefined, media, extra || {})
  }

  async answerCbQuery(extra) {
    const cq = this.callbackQuery
    if (!cq) throw new Error("callback_query required for answerCbQuery")
    return await this.api.answerCallbackQuery(cq.id, extra)
  }
}

module.exports = { Context }
