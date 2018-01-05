global.fetch = require('node-fetch')
const coinmarketcap = require('coinmarketcap')

let TICKERS = {}

const persistTickers = (tickers) => { TICKERS = tickers }

const getTickers = async () => {
  return await coinmarketcap.ticker().then(tickers => tickers)
}

getTickers().then(tickers => persistTickers(tickers))

