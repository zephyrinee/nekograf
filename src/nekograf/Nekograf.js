const { Composer } = require("./Composer")
const { Router } = require("./Router")
const { Context } = require("./Context")
const { TelegramApi } = require("../api/TelegramApi")
const { PollingAdapter } = require("../adapters/PollingAdapter")
const { WebhookAdapter } = require("../adapters/WebhookAdapter")

class Nekograf {
  constructor(opts) {
    const o = opts || {}
    if (!o.token) throw new Error("token is required")
    this.token = o.token
    this.api = new TelegramApi(this.token, o.api || {})
    this.telegram = this.api.telegraf
    this.composer = new Composer()
    this.router = new Router()
    this.mode = o.polling === false ? "webhook" : "polling"
    this.webhookOptions = null
    this.adapter = this.mode === "polling" ? new PollingAdapter(this.api, o.pollingOptions || {}) : null
    this.errorHandler = async (err) => { throw err }

    if (this.adapter) {
      this.adapter.setHandlers({
        onUpdate: async (u) => this._handleUpdate(u),
        onError: async (e) => this.errorHandler(e)
      })
    }
  }

  nekoBotUse(mw) { this.composer.use(mw); return this }
  nekoBotOn(event, handler) { this.router.on(event, handler); return this }
  nekoBotOnText(pattern, handler) { this.router.onText(pattern, handler); return this }
  nekoBotHears(pattern, handler) { this.router.hears(pattern, handler); return this }
  nekoBotCommand(name, handler) { this.router.command(name, handler); return this }
  nekoBotAction(pattern, handler) { this.router.action(pattern, handler); return this }

  nekoBotCatch(handler) {
    if (typeof handler !== "function") throw new TypeError("error handler must be function")
    this.errorHandler = handler
    return this
  }

  nekoBotWebhook(opts) {
    this.mode = "webhook"
    this.webhookOptions = Object.assign({ host: "0.0.0.0", port: 3000, path: "/webhook" }, opts || {})
    this.adapter = new WebhookAdapter(this.api, this.webhookOptions)
    this.adapter.setHandlers({
      onUpdate: async (u) => this._handleUpdate(u),
      onError: async (e) => this.errorHandler(e)
    })
    return this
  }

  async _handleUpdate(update) {
    const ctx = new Context({ update, api: this.api })
    const mw = this.composer.middleware()
    try {
      await mw(ctx)
      await this.router.dispatch(ctx)
    } catch (e) {
      await this.errorHandler(e, ctx)
    }
  }

  async nekoBotStart() {
    if (!this.adapter) throw new Error("No adapter configured")
    await this.adapter.start()
  }

  async nekoBotStop() {
    if (!this.adapter) return
    await this.adapter.stop()
  }

  use(mw) { return this.nekoBotUse(mw) }
  on(event, handler) { return this.nekoBotOn(event, handler) }
  onText(pattern, handler) { return this.nekoBotOnText(pattern, handler) }
  hears(pattern, handler) { return this.nekoBotHears(pattern, handler) }
  command(name, handler) { return this.nekoBotCommand(name, handler) }
  action(pattern, handler) { return this.nekoBotAction(pattern, handler) }
  catch(handler) { return this.nekoBotCatch(handler) }
  start() { return this.nekoBotStart() }
  stop() { return this.nekoBotStop() }

  NekoBotUse(mw) { return this.nekoBotUse(mw) }
  NekoBotOn(event, handler) { return this.nekoBotOn(event, handler) }
  NekoBotOnText(pattern, handler) { return this.nekoBotOnText(pattern, handler) }
  NekoBotHears(pattern, handler) { return this.nekoBotHears(pattern, handler) }
  NekoBotCommand(name, handler) { return this.nekoBotCommand(name, handler) }
  NekoBotAction(pattern, handler) { return this.nekoBotAction(pattern, handler) }
  NekoBotCatch(handler) { return this.nekoBotCatch(handler) }
  NekoBotStart() { return this.nekoBotStart() }
  NekoBotStop() { return this.nekoBotStop() }

  BotUse(mw) { return this.nekoBotUse(mw) }
  BotOn(event, handler) { return this.nekoBotOn(event, handler) }
  BotOnText(pattern, handler) { return this.nekoBotOnText(pattern, handler) }
  BotHears(pattern, handler) { return this.nekoBotHears(pattern, handler) }
  BotCommand(name, handler) { return this.nekoBotCommand(name, handler) }
  BotAction(pattern, handler) { return this.nekoBotAction(pattern, handler) }
  BotCatch(handler) { return this.nekoBotCatch(handler) }
  BotStart() { return this.nekoBotStart() }
  BotStop() { return this.nekoBotStop() }
}

module.exports = { Nekograf }
