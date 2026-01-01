function isRegex(x) {
  return x && typeof x === "object" && x.constructor && x.constructor.name === "RegExp"
}

function toMatcher(pattern) {
  if (isRegex(pattern)) return { type: "regex", value: pattern }
  if (typeof pattern === "string") return { type: "string", value: pattern }
  throw new TypeError("pattern must be RegExp or string")
}

function matchText(matcher, text) {
  if (matcher.type === "string") return text.includes(matcher.value) ? [matcher.value] : null
  const m = text.match(matcher.value)
  return m || null
}

function matchExact(matcher, text) {
  if (matcher.type === "string") return text === matcher.value ? [matcher.value] : null
  const m = text.match(matcher.value)
  return m || null
}

class Router {
  constructor() {
    this.events = new Map()
    this.textMatchers = []
    this.hearsMatchers = []
    this.commandHandlers = new Map()
    this.actionMatchers = []
  }

  on(event, handler) {
    if (typeof handler !== "function") throw new TypeError("handler must be function")
    const arr = this.events.get(event) || []
    arr.push(handler)
    this.events.set(event, arr)
    return this
  }

  onText(pattern, handler) {
    if (typeof handler !== "function") throw new TypeError("handler must be function")
    this.textMatchers.push({ matcher: toMatcher(pattern), handler })
    return this
  }

  hears(pattern, handler) {
    if (typeof handler !== "function") throw new TypeError("handler must be function")
    this.hearsMatchers.push({ matcher: toMatcher(pattern), handler })
    return this
  }

  command(name, handler) {
    if (typeof name !== "string" || !name) throw new TypeError("command name must be string")
    if (typeof handler !== "function") throw new TypeError("handler must be function")
    this.commandHandlers.set(name.toLowerCase(), handler)
    return this
  }

  action(pattern, handler) {
    if (typeof handler !== "function") throw new TypeError("handler must be function")
    this.actionMatchers.push({ matcher: toMatcher(pattern), handler })
    return this
  }

  async dispatch(ctx) {
    const update = ctx.update || {}
    const msg = ctx.message
    const evs = []

    if (update.message) evs.push("message")
    if (update.edited_message) evs.push("edited_message")
    if (update.callback_query) evs.push("callback_query")
    if (update.inline_query) evs.push("inline_query")
    if (update.channel_post) evs.push("channel_post")
    if (update.my_chat_member) evs.push("my_chat_member")
    if (update.chat_member) evs.push("chat_member")

    for (const ev of evs) {
      const hs = this.events.get(ev)
      if (hs) for (const h of hs) await h(ctx)
    }

    if (update.callback_query && typeof update.callback_query.data === "string") {
      const data = update.callback_query.data
      for (const item of this.actionMatchers) {
        const match = matchExact(item.matcher, data)
        if (match) await item.handler(ctx, match)
      }
    }

    if (msg && typeof msg.text === "string") {
      const text = msg.text

      if (text.startsWith("/")) {
        const first = text.split(/\s+/)[0].slice(1)
        const cmd = first.split("@")[0].toLowerCase()
        const h = this.commandHandlers.get(cmd)
        if (h) await h(ctx)
      }

      for (const item of this.hearsMatchers) {
        const match = matchExact(item.matcher, text)
        if (match) await item.handler(ctx, match)
      }

      for (const item of this.textMatchers) {
        const match = matchText(item.matcher, text)
        if (match) await item.handler(ctx, match)
      }
    }
  }
}

module.exports = { Router }
