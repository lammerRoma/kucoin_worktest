const WebSocket = require('ws');
const axios = require('axios');
const http = require("http");

class App {

  arr = [];
  ws = {};
  heartbeat = {};
  ask;
  bid;

  constructor(ask, bid) {
  this.ask = ask;
  this.bid = bid;
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
      
      const endpoint = `/market/level2:${this.ask}-${this.bid}`;
      const topic = 'orderbook';
      const type = 'public';

      let websocket = await this.getSocketEndpoint()
      const ws = new WebSocket(websocket); 
      this.ws[topic] = ws;
      ws.on('open', () => {
        console.log(topic + ' opening websocket connection... ');
        this.subscribe(topic, endpoint)
          .then( res => console.log(res))
        this.ws[topic].heartbeat = setInterval( this.socketHeartBeat.bind(this), 20000, topic);
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

  subscribe = async function(topic, endpoint) {
    let ws = this.ws[topic]

    ws.send(JSON.stringify({
      id: Date.now(),
      type: 'subscribe',
      topic: endpoint,
      response: true
    }))
    
    ws.on('message', msg => {
      return msg
    }) 
  }

  unsubscribe = async function(topic, endpoint, eventHandler) {
    let ws = this.ws[topic]
    ws.send(JSON.stringify({
      id: Date.now(),
      type: 'unsubscribe',
      topic: endpoint,
      response: true
    }))
    ws.on('message', msg => {
      console.log('Unubscribe ');
    })
  }

  eventHandler = function () {
    
  }
}


const app = new App('BTC','USDT')

app.initSocket();
