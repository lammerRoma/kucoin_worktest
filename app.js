const http = require('http')
const WebSocket = require('ws');
const axios = require('axios');

async function orderBook() {
  let r = await axios.get('https://api.kucoin.com/api/v1/market/orderbook/level2_20?symbol=BTC-USDT')
  return r.data;
}

const re = orderBook();

console.log(re)