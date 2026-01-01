class Composer {
  constructor() {
    this.stack = []
  }

  use(fn) {
    if (typeof fn !== "function") throw new TypeError("middleware must be function")
    this.stack.push(fn)
    return this
  }

  middleware() {
    const stack = this.stack.slice()
    return async (ctx) => {
      let idx = -1
      const dispatch = async (i) => {
        if (i <= idx) throw new Error("next called multiple times")
        idx = i
        const fn = stack[i]
        if (!fn) return
        await fn(ctx, () => dispatch(i + 1))
      }
      await dispatch(0)
    }
  }
}

module.exports = { Composer }
