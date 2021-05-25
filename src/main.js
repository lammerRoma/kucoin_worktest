const WebSocket = require('ws');
const axios = require('axios');

class App {
  cachedData = {
    data: []
  }

  localOrderBook = {
    status: 'stop',
    sequence: 0,
    bids: new Map(),
    asks: new Map()
  }
  
  ws = {};
  heartbeat = {};
  symbol1;
  symbol2;
  

  constructor(symbol1, symbol2) {
 
  this.symbol1 = symbol1;
  this.symbol2 = symbol2;
  }

  getPublicWsToken = async function () {
    const baseURL = 'https://api.kucoin.com'
    const endpoint = `/api/v1/bullet-public`
    const url = baseURL + endpoint;
    const result = await axios.post(url, {});
    return result;
  }

  getSocketEndpoint = async function() {
    const r = await this.getPublicWsToken()

    const token = r.data.data.token;
    const instanceServer = r.data.data.instanceServers[0]

    if(instanceServer){
        return `${instanceServer.endpoint}?token=${token}&[connectId=${Date.now()}]`
    } else {
      throw Error("No Kucoin WS servers running")
    }
  }

  initSocket = async function () {

    try {
      
      const endpoint = `/market/level2:${this.symbol1}-${this.symbol2}`;
      const topic = 'orderbook';
      const type = 'public';

      let websocket = await this.getSocketEndpoint();
      const ws = new WebSocket(websocket); 
      this.ws[topic] = ws;
      
      ws.on('open', () => {
        console.log(topic + ' opening websocket connection... ');
         
        ws.on('message', (msg) => {
          const msgObj = JSON.parse(msg);
          
          
          this.cacheData(msgObj);
          this.updateLocalOrderBook();
          
        })

        this.subscribe(topic, endpoint);
        this.setOrderBook();
        this.updateLocalOrderBook();
        // setInterval(this.showLog.bind(this), 500);

        this.ws[topic].heartbeat = setInterval( this.socketHeartBeat.bind(this), 20000, topic);
        // setTimeout( this.unsubscribe.bind(this), 10000, topic, endpoint);
      })
      ws.on('error', (error) => {
        this.handleSocketError(error);
        console.log(error);
      })
      ws.on('ping', () => {
        return
      })
      ws.on('close', () => {
        clearInterval(this.ws[topic].heartbeat)
        console.log(topic + ' websocket closed. Reconect will be attempted in 1 second')
        setTimeout(() => {
          this.initSocket()
        }, 1000);
      })
    } catch(err) {
      console.log(err)
    }
    
  }

  handleSocketError = function (error) {
  console.log('WebSocket error: ' + (error.code ? ' (' + error.code + ')' : '') +
  (error.message ? ' ' + error.message : ''))
  }

  socketHeartBeat = function(topic) {
    let ws = this.ws[topic]
    ws.ping()
  }

  subscribe = function(topic, endpoint) {
    let ws = this.ws[topic]

    ws.send(JSON.stringify({
      id: Date.now(),
      type: 'subscribe',
      topic: endpoint,
      response: true
    }))
  }

  unsubscribe = function(topic, endpoint) {
    let ws = this.ws[topic]

    ws.send(JSON.stringify({
      id: Date.now(),
      type: 'unsubscribe',
      topic: endpoint,
      privateChannel: false,
      response: true
    }))
    console.log('unsubscribe')
  }

  setOrderBook = async function () {
    const orderBook = await axios.get('https://api.kucoin.com/api/v1/market/orderbook/level2_20?symbol=BTC-USDT')
    const bids = orderBook.data.data.bids;
    const asks = orderBook.data.data.asks;
    this.localOrderBook.sequence = orderBook.data.data.sequence;
    bids.forEach ( el => {
      this.localOrderBook.bids.set(el[0], el[1])
      
    })
    asks.forEach ( el => {
      this.localOrderBook.asks.set(el[0], el[1])
    })
    this.localOrderBook.status = 'ready'
  }

  cacheData = function (msg) {
    if (msg.data) {
      if (msg.data.changes){
        if (msg.data.changes.asks.length !== 0) {
          const list = 'asks'
          for (let i = 0; i < msg.data.changes.asks.length; i++) {
            let data = msg.data.changes.asks[i];
            data.push(list);
            this.cachedData.data.push(data);
          }
        }
        if (msg.data.changes.bids.length !== 0) {
          const list = 'bids'
          for (let i = 0; i < msg.data.changes.bids.length; i++) {
            let data = msg.data.changes.bids[i];
            data.push(list);
            this.cachedData.data.push(data);
          }
        }
      }
    }
  }

  updateLocalOrderBook = function () {
    
    if ( this.localOrderBook.status == 'ready' ) {
      let sequence = this.localOrderBook.sequence;
      this.cachedData.data.forEach(el => {

      if ( el[2] > sequence ) {
        if ( sequence == el[2] - 1){
          const price = el[0];
          const size = el[1];
          const sequence = el[2];
          const list = el[3];

        if (price == 0) {
          this.localOrderBook.sequence = sequence;
          this.cachedData.data.splice(el, 1)
        } else if (size == 0) {
          this.localOrderBook.sequence = sequence;
          this.localOrderBook[list].delete(price);
          this.cachedData.data.splice(el, 1)
          } else {
          this.localOrderBook.sequence = sequence;
          this.localOrderBook[list].set(price, size)
          this.cachedData.data.splice(el, 1)
          }
          } else {
          this.localOrderBook.status = 'stop';
          this.setOrderBook();
          } 
          
        } else {
          this.cachedData.data.splice(el, 1)
        }
      })
    }

  }

  getBestAskBid = function () {

    if (this.localOrderBook.status == 'ready') {
      let askPrices = [];
      let bidPrices = [];
      for(let el of this.localOrderBook.asks.keys()){
        
        askPrices.push(el)
      }

      for(let el of this.localOrderBook.bids.keys()){
        bidPrices.push(el)
      }

      askPrices.sort( (a, b) => {return a - b})
      bidPrices.sort( (a, b) => {return b - a})
      console.log(bidPrices)

      

      let bestAsk = askPrices[0];
      let bestBid = bidPrices[0];

      return [bestAsk, bestBid];

    } else return ['No date', 'No date']
  }

  showLog = function()  {

    const [bestAsk, bestBid] = this.getBestAskBid();

    console.log(`The best ask: ${bestAsk}`)
    console.log(`The best bid: ${bestBid}`)
  } 

  getBestAskBidForClient =  function (res) {
    if (this.localOrderBook.status == 'ready'){
    
      const [ask, bid] = this.getBestAskBid();

      const askSize = this.localOrderBook.asks.get(ask);
      const bidSize = this.localOrderBook.bids.get(bid);


      const str = `Symbol ${this.symbol1} - ${this.symbol2}\n 
        The BEST ask: ${ask} Size: ${askSize} \n 
        The BEST bid: ${bid} Size: ${bidSize}`

      res.end(str);  
    
    } else {
      res.end('No date');
    }
  }

}


module.exports = App;
