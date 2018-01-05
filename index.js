global.fetch = require('node-fetch')
require('dotenv').load()

const _ = require('lodash')

const coinmarketcap = require('coinmarketcap')
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_TOKEN
const stockMatcher = /(\$[\w,]+)\b/g

const bot = new TelegramBot(token, { polling: true });

let TICKERS = []

const handleErr = err => console.error(err)

const persistTickers = (tickers) => {
  TICKERS = tickers
}

const getTickers = async () => {
  return await coinmarketcap.ticker({ limit: 0 }).then(tickers => tickers)
}

getTickers().then(tickers => persistTickers(tickers))

const parseMsg = (msg) => {
  const { chat, text } = msg
  const { id } = chat
  if (text.length && text.includes("$")) {
    const match = text.match(stockMatcher)
    if (match) {
      const matches = _.compact(_.uniq(match.map(m => {
        // This sucks
        if (typeof m == "string") { return m }
      })))

      matches.forEach(match => {
        const symbol = match.slice(1)
        const foundTicker = TICKERS.find(t => t.symbol.toLowerCase() === symbol.toLowerCase())
        if (foundTicker) {
          const url = `https://coinmarketcap.com/currencies/${foundTicker.id}`
          const lines = [
            `<b>${foundTicker.name}</b>`,
            `Symbol: ${foundTicker.symbol}`,
            `USD value: $${foundTicker.price_usd}`,
            `BTC value: ${foundTicker.price_btc}`,
            `% 1hr: ${foundTicker.percent_change_1h}%`,
            `% 24h: ${foundTicker.percent_change_24h}%`,
            `% change 7d: ${foundTicker.percent_change_7d}%`,
            url
          ]

          const message = lines.join("\n")
          bot.sendMessage(id, message, { parse_mode: 'HTML' })
        }
      })
    }
  }
}

bot.on('message', msg => parseMsg(msg))
bot.on('polling_error', err => handleErr(err))

