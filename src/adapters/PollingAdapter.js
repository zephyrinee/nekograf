class PollingAdapter {
  constructor(api, opts) {
    this.api = api
    this.intervalMs = (opts && opts.intervalMs) || 1000
    this.timeout = (opts && opts.timeout) || 30
    this.allowed_updates = (opts && opts.allowed_updates) || []
    this.offset = 0
    this.running = false
    this.onUpdate = null
    this.onError = null
  }

  setHandlers({ onUpdate, onError }) {
    this.onUpdate = onUpdate
    this.onError = onError
  }

  async start() {
    if (this.running) return
    this.running = true
    while (this.running) {
      try {
        const updates = await this.api.getUpdates({
          offset: this.offset,
          timeout: this.timeout,
          allowed_updates: this.allowed_updates.length ? this.allowed_updates : undefined
        })
        if (Array.isArray(updates) && updates.length) {
          for (const u of updates) {
            this.offset = Math.max(this.offset, (u.update_id || 0) + 1)
            if (this.onUpdate) await this.onUpdate(u)
          }
        }
      } catch (e) {
        if (this.onError) await this.onError(e)
      }
      await new Promise(r => setTimeout(r, this.intervalMs))
    }
  }

  stop() { this.running = false }
}

module.exports = { PollingAdapter }
