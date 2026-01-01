const http = require("http")

class WebhookAdapter {
  constructor(api, opts) {
    this.api = api
    this.opts = Object.assign({ host: "0.0.0.0", port: 3000, path: "/webhook" }, opts || {})
    this.server = null
    this.onUpdate = null
    this.onError = null
  }

  setHandlers({ onUpdate, onError }) {
    this.onUpdate = onUpdate
    this.onError = onError
  }

  async start() {
    if (this.server) return
    const { host, port, path } = this.opts
    this.server = http.createServer(async (req, res) => {
      if (req.method !== "POST" || req.url !== path) {
        res.statusCode = 404
        res.end("not found")
        return
      }
      let raw = ""
      req.setEncoding("utf8")
      req.on("data", (c) => raw += c)
      req.on("end", async () => {
        try {
          const update = JSON.parse(raw || "{}")
          if (this.onUpdate) await this.onUpdate(update)
          res.statusCode = 200
          res.end("ok")
        } catch (e) {
          if (this.onError) await this.onError(e)
          res.statusCode = 400
          res.end("bad request")
        }
      })
    })
    await new Promise((resolve, reject) => {
      this.server.on("error", reject)
      this.server.listen(port, host, resolve)
    })
  }

  async stop() {
    if (!this.server) return
    const s = this.server
    this.server = null
    await new Promise((resolve) => s.close(() => resolve()))
  }
}

module.exports = { WebhookAdapter }
