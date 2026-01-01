const { MemoryStore } = require("../stores/memory")

function session(opts) {
  const o = opts || {}
  const store = o.store || new MemoryStore()
  const getKey = o.getKey || ((ctx) => {
    const from = ctx.from
    const chat = ctx.chat
    const a = chat && chat.id !== undefined ? "c:" + chat.id : ""
    const b = from && from.id !== undefined ? "u:" + from.id : ""
    const key = a + "|" + b
    return key || "global"
  })

  return async (ctx, next) => {
    const key = getKey(ctx)
    const data = await store.get(key)
    ctx.session = data || {}
    await next()
    await store.set(key, ctx.session || {})
  }
}

module.exports = { session }
