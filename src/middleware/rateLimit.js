function rateLimit(opts) {
  const o = Object.assign({ windowMs: 1000, limit: 5, key: (ctx) => String(ctx.chatId || "global") }, opts || {})
  const buckets = new Map()

  return async (ctx, next) => {
    const k = o.key(ctx)
    const now = Date.now()
    const b = buckets.get(k) || { count: 0, resetAt: now + o.windowMs }
    if (now > b.resetAt) {
      b.count = 0
      b.resetAt = now + o.windowMs
    }
    b.count += 1
    buckets.set(k, b)
    if (b.count > o.limit) return
    await next()
  }
}

module.exports = { rateLimit }
