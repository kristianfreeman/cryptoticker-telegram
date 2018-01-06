global.fetch = require('node-fetch')
require('dotenv').load()

const _ = require('lodash')

const cc = require('cryptocompare')
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_TOKEN
const stockMatcher = /(\$[\w,]+)\b/g

const sb = require('satoshi-bitcoin');

const bot = new TelegramBot(token, { polling: true });

let TICKERS = []

const handleErr = err => console.error(err)

const persistTickers = (tickers) => {
  TICKERS = tickers
}

const getTickers = () => {
  return cc.coinList()
    .then(resp => _.values(resp.Data))
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
        const foundTicker = TICKERS.find(t => t.Symbol.toLowerCase() === symbol.toLowerCase())
        if (foundTicker) {
          cc.priceFull(foundTicker.Symbol, ['USD', 'BTC'])
            .then(resp => {
              const prices = resp[foundTicker.Symbol]
              const url = ['https://cryptocompare.com', foundTicker.Url].join('')
              const lines = [
                `<b>${foundTicker.Name}</b>`,
                `Symbol: ${foundTicker.Symbol}`,
                `USD value: $${prices.USD.PRICE}`,
                `BTC value (in satoshi): ${sb.toSatoshi(prices.BTC.PRICE)}`,
                url
              ]

              const message = lines.join("\n")
              bot.sendMessage(id, message, { parse_mode: 'HTML' })
            })
        }
      })
    }
  }
}

bot.on('message', msg => parseMsg(msg))
bot.on('polling_error', err => handleErr(err))

