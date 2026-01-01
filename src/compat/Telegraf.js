const { Nekograf } = require("../nekograf/Nekograf")

class Telegraf {
  constructor(token, opts) {
    const o = opts || {}
    this.core = new Nekograf({ token, polling: true, pollingOptions: o.pollingOptions || {} })
    this.telegram = this.core.telegram
  }

  use(mw) { this.core.nekoBotUse(mw); return this }
  on(event, handler) { this.core.nekoBotOn(event, handler); return this }
  hears(pattern, handler) { this.core.nekoBotHears(pattern, handler); return this }
  command(name, handler) { this.core.nekoBotCommand(name, handler); return this }
  action(pattern, handler) { this.core.nekoBotAction(pattern, handler); return this }

  launch() { return this.core.nekoBotStart() }
  stop() { return this.core.nekoBotStop() }
}

module.exports = { Telegraf }
