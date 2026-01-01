const { Readable } = require("stream")
const fs = require("fs")

function isReadable(x) {
  return x && typeof x.pipe === "function" && typeof x.on === "function"
}

function isFilePath(x) {
  return typeof x === "string" && (x.startsWith("./") || x.startsWith("../") || x.startsWith("/") || x.includes(":\\") || x.includes("\\"))
}

function fileValueToStream(v) {
  if (Buffer.isBuffer(v)) return { stream: Readable.from(v), filename: "file" }
  if (isReadable(v)) return { stream: v, filename: "file" }
  if (isFilePath(v)) return { stream: fs.createReadStream(v), filename: v.split(/[\\\/]/).pop() || "file" }
  if (typeof v === "object" && v && v.source) {
    const src = v.source
    const filename = v.filename || "file"
    if (Buffer.isBuffer(src)) return { stream: Readable.from(src), filename }
    if (isReadable(src)) return { stream: src, filename }
    if (isFilePath(src)) return { stream: fs.createReadStream(src), filename: v.filename || (src.split(/[\\\/]/).pop() || "file") }
  }
  return null
}

function boundary() {
  return "nekograf_" + Math.random().toString(16).slice(2) + Date.now().toString(16)
}

function buildMultipart(fields) {
  const b = boundary()
  const parts = []
  for (const [k, v] of Object.entries(fields || {})) {
    if (v === undefined || v === null) continue
    const streamInfo = fileValueToStream(v)
    if (streamInfo) {
      parts.push({ type: "file", name: k, filename: streamInfo.filename, stream: streamInfo.stream })
    } else {
      const value = typeof v === "object" ? JSON.stringify(v) : String(v)
      parts.push({ type: "field", name: k, value })
    }
  }
  return { boundary: b, parts }
}

module.exports = { buildMultipart }
