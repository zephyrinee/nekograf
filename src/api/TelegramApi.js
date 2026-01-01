const https = require("https")
const { TelegramApiError } = require("../nekograf/errors")
const { buildMultipart } = require("./Multipart")

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function isFileIdLike(x) {
  return typeof x === "string" && /^[A-Za-z0-9_-]{20,}$/.test(x)
}

function isUrl(x) {
  return typeof x === "string" && (x.startsWith("http://") || x.startsWith("https://"))
}

function isUploadValue(x) {
  if (x === null || x === undefined) return false
  if (Buffer.isBuffer(x)) return true
  if (typeof x === "object" && x && x.source) return true
  if (typeof x === "object" && x && typeof x.pipe === "function") return true
  if (typeof x === "string") {
    if (isUrl(x) || isFileIdLike(x)) return false
    if (x.startsWith("attach://")) return false
    return true
  }
  return false
}

class TelegramApi {
  constructor(token, opts) {
    if (!token) throw new Error("token is required")
    this.token = token
    this.baseHost = (opts && opts.baseHost) || "api.telegram.org"
    this.timeoutMs = (opts && opts.timeoutMs) || 30000
    this.retry = Object.assign({ retries: 2 }, (opts && opts.retry) || {})
    this.telegraf = this._buildTelegrafFacade()
  }

  _request({ method, path, headers, body }) {
    const options = { hostname: this.baseHost, port: 443, path, method, headers: headers || {}, timeout: this.timeoutMs }
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let raw = ""
        res.setEncoding("utf8")
        res.on("data", (chunk) => raw += chunk)
        res.on("end", () => resolve({ statusCode: res.statusCode, raw }))
      })
      req.on("timeout", () => req.destroy(new Error("Request timeout")))
      req.on("error", (err) => reject(err))
      if (body) req.write(body)
      req.end()
    })
  }

  _requestMultipart({ path, boundary, parts }) {
    const options = {
      hostname: this.baseHost,
      port: 443,
      path,
      method: "POST",
      headers: { "Content-Type": "multipart/form-data; boundary=" + boundary },
      timeout: this.timeoutMs
    }
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let raw = ""
        res.setEncoding("utf8")
        res.on("data", (chunk) => raw += chunk)
        res.on("end", () => resolve({ statusCode: res.statusCode, raw }))
      })
      req.on("timeout", () => req.destroy(new Error("Request timeout")))
      req.on("error", (err) => reject(err))

      const writeField = (name, value) => {
        req.write("--" + boundary + "\r\n")
        req.write('Content-Disposition: form-data; name="' + name + '"\r\n\r\n')
        req.write(value)
        req.write("\r\n")
      }

      const writeFileHeader = (name, filename) => {
        req.write("--" + boundary + "\r\n")
        req.write('Content-Disposition: form-data; name="' + name + '"; filename="' + filename + '"\r\n')
        req.write("Content-Type: application/octet-stream\r\n\r\n")
      }

      const writeFileFooter = () => {
        req.write("\r\n")
      }

      const end = () => {
        req.write("--" + boundary + "--\r\n")
        req.end()
      }

      const run = async () => {
        try {
          for (const p of parts) {
            if (p.type === "field") {
              writeField(p.name, p.value)
            } else {
              writeFileHeader(p.name, p.filename)
              await new Promise((resolveStream, rejectStream) => {
                p.stream.on("error", rejectStream)
                p.stream.on("end", resolveStream)
                p.stream.pipe(req, { end: false })
              })
              writeFileFooter()
            }
          }
          end()
        } catch (err) {
          reject(err)
        }
      }

      run()
    })
  }

  async call(method, payload) {
    const path = "/bot" + this.token + "/" + method
    const data = JSON.stringify(payload || {})
    const headers = { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }

    let attempt = 0
    while (true) {
      attempt += 1
      const res = await this._request({ method: "POST", path, headers, body: data })
      let parsed
      try { parsed = JSON.parse(res.raw) } catch (e) {
        throw new TelegramApiError("Invalid JSON response", { raw: res.raw })
      }
      if (parsed && parsed.ok === true) return parsed.result
      if (parsed && parsed.error_code === 429) {
        const params = parsed.parameters || {}
        const retryAfter = Number(params.retry_after || 1)
        if (attempt <= (this.retry.retries + 1)) {
          await sleep(Math.max(0, retryAfter) * 1000)
          continue
        }
      }
      const desc = parsed && parsed.description ? parsed.description : "Telegram API error"
      throw new TelegramApiError(desc, parsed)
    }
  }

  async callMultipart(method, fields) {
    const { boundary, parts } = buildMultipart(fields || {})
    const path = "/bot" + this.token + "/" + method

    let attempt = 0
    while (true) {
      attempt += 1
      const res = await this._requestMultipart({ path, boundary, parts })
      let parsed
      try { parsed = JSON.parse(res.raw) } catch (e) {
        throw new TelegramApiError("Invalid JSON response", { raw: res.raw })
      }
      if (parsed && parsed.ok === true) return parsed.result
      if (parsed && parsed.error_code === 429) {
        const params = parsed.parameters || {}
        const retryAfter = Number(params.retry_after || 1)
        if (attempt <= (this.retry.retries + 1)) {
          await sleep(Math.max(0, retryAfter) * 1000)
          continue
        }
      }
      const desc = parsed && parsed.description ? parsed.description : "Telegram API error"
      throw new TelegramApiError(desc, parsed)
    }
  }

  getMe() { return this.call("getMe", {}) }
  setWebhook(payload) { return this.call("setWebhook", payload || {}) }
  deleteWebhook(payload) { return this.call("deleteWebhook", payload || {}) }
  getUpdates(payload) { return this.call("getUpdates", payload || {}) }

  sendMessage(chatId, text, extra) {
    const payload = Object.assign({}, extra || {}, { chat_id: chatId, text })
    return this.call("sendMessage", payload)
  }

  answerCallbackQuery(callbackQueryId, extra) {
    const payload = Object.assign({}, extra || {}, { callback_query_id: callbackQueryId })
    return this.call("answerCallbackQuery", payload)
  }

  editMessageText(payload) { return this.call("editMessageText", payload || {}) }
  editMessageCaption(payload) { return this.call("editMessageCaption", payload || {}) }
  editMessageMedia(payload) { return this.call("editMessageMedia", payload || {}) }

  setMyCommands(commands, extra) {
    const payload = Object.assign({}, extra || {}, { commands })
    return this.call("setMyCommands", payload)
  }

  setMyName(name, extra) {
    const payload = Object.assign({}, extra || {}, { name })
    return this.call("setMyName", payload)
  }

  setMyDescription(description, extra) {
    const payload = Object.assign({}, extra || {}, { description })
    return this.call("setMyDescription", payload)
  }

  setMyShortDescription(short_description, extra) {
    const payload = Object.assign({}, extra || {}, { short_description })
    return this.call("setMyShortDescription", payload)
  }

  _sendFile(method, chatId, fieldName, fileValue, extra) {
    const payload = Object.assign({}, extra || {}, { chat_id: chatId })
    payload[fieldName] = fileValue
    if (isUploadValue(fileValue)) return this.callMultipart(method, payload)
    return this.call(method, payload)
  }

  sendPhoto(chatId, photo, extra) { return this._sendFile("sendPhoto", chatId, "photo", photo, extra) }
  sendDocument(chatId, document, extra) { return this._sendFile("sendDocument", chatId, "document", document, extra) }
  sendVideo(chatId, video, extra) { return this._sendFile("sendVideo", chatId, "video", video, extra) }
  sendAudio(chatId, audio, extra) { return this._sendFile("sendAudio", chatId, "audio", audio, extra) }
  sendVoice(chatId, voice, extra) { return this._sendFile("sendVoice", chatId, "voice", voice, extra) }
  sendAnimation(chatId, animation, extra) { return this._sendFile("sendAnimation", chatId, "animation", animation, extra) }
  sendSticker(chatId, sticker, extra) { return this._sendFile("sendSticker", chatId, "sticker", sticker, extra) }

  _buildTelegrafFacade() {
    const api = this
    return {
      sendMessage: (chatId, text, extra) => api.sendMessage(chatId, text, extra),
      sendPhoto: (chatId, photo, extra) => api.sendPhoto(chatId, photo, extra),
      sendDocument: (chatId, document, extra) => api.sendDocument(chatId, document, extra),
      sendVideo: (chatId, video, extra) => api.sendVideo(chatId, video, extra),
      sendAudio: (chatId, audio, extra) => api.sendAudio(chatId, audio, extra),
      sendVoice: (chatId, voice, extra) => api.sendVoice(chatId, voice, extra),
      sendSticker: (chatId, sticker, extra) => api.sendSticker(chatId, sticker, extra),
      sendAnimation: (chatId, animation, extra) => api.sendAnimation(chatId, animation, extra),
      answerCbQuery: (callbackQueryId, extra) => api.answerCallbackQuery(callbackQueryId, extra),
      answerCallbackQuery: (callbackQueryId, extra) => api.answerCallbackQuery(callbackQueryId, extra),
      editMessageCaption: (chatId, messageId, inlineMessageId, caption, extra) => {
        const payload = Object.assign({}, extra || {}, { chat_id: chatId, message_id: messageId, inline_message_id: inlineMessageId, caption })
        return api.editMessageCaption(payload)
      },
      editMessageMedia: (chatId, messageId, inlineMessageId, media, extra) => {
        const payload = Object.assign({}, extra || {}, { chat_id: chatId, message_id: messageId, inline_message_id: inlineMessageId, media })
        return api.editMessageMedia(payload)
      },
      editMessageText: (chatId, messageId, inlineMessageId, text, extra) => {
        const payload = Object.assign({}, extra || {}, { chat_id: chatId, message_id: messageId, inline_message_id: inlineMessageId, text })
        return api.editMessageText(payload)
      },
      setMyCommands: (commands, extra) => api.setMyCommands(commands, extra),
      setMyName: (name, extra) => api.setMyName(name, extra),
      setMyDescription: (description, extra) => api.setMyDescription(description, extra),
      setMyShortDescription: (short_description, extra) => api.setMyShortDescription(short_description, extra),
      callApi: (method, payload) => api.call(method, payload)
    }
  }
}

module.exports = { TelegramApi }
