class MemoryStore {
  constructor() { this.map = new Map() }
  async get(key) { return this.map.get(key) || null }
  async set(key, value) { this.map.set(key, value) }
  async delete(key) { this.map.delete(key) }
}

module.exports = { MemoryStore }
