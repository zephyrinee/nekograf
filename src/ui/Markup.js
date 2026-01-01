function button(text, data) {
  return { text: String(text), callback_data: String(data) }
}

function urlButton(text, url) {
  return { text: String(text), url: String(url) }
}

function inlineKeyboard(rows) {
  return { reply_markup: { inline_keyboard: rows } }
}

function keyboard(rows, opts) {
  const o = Object.assign({ resize_keyboard: true }, opts || {})
  return { reply_markup: Object.assign({}, o, { keyboard: rows }) }
}

const Markup = { button, urlButton, inlineKeyboard, keyboard }

module.exports = { Markup }
