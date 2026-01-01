class NekografError extends Error {
  constructor(message, extra) {
    super(message)
    this.name = "NekografError"
    this.extra = extra || null
  }
}

class TelegramApiError extends NekografError {
  constructor(message, data) {
    super(message, data)
    this.name = "TelegramApiError"
  }
}

module.exports = { NekografError, TelegramApiError }
