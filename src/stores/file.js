const fs = require("fs")
const path = require("path")

class FileStore {
  constructor(opts) {
    this.dir = (opts && opts.dir) || ".nekograf_sessions"
    fs.mkdirSync(this.dir, { recursive: true })
  }

  _file(key) {
    const safe = String(key).replace(/[^a-zA-Z0-9._-]/g, "_")
    return path.join(this.dir, safe + ".json")
  }

  async get(key) {
    const f = this._file(key)
    try {
      const raw = await fs.promises.readFile(f, "utf8")
      return JSON.parse(raw)
    } catch (e) {
      return null
    }
  }

  async set(key, value) {
    const f = this._file(key)
    await fs.promises.writeFile(f, JSON.stringify(value || {}, null, 0), "utf8")
  }

  async delete(key) {
    const f = this._file(key)
    try { await fs.promises.unlink(f) } catch (e) {}
  }
}

module.exports = { FileStore }
