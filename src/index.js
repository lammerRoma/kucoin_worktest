const WebSocket = require('ws');
const axios = require('axios');

const Sockets = {};
Sockets.ws = {};
Sockets.heartbeat = {};

getPublicWsToken = async function(baseURL) {
  let endpoint = '/api/v1/bullet-public';
  let url = baseURL + endpoint;
  let result = await axios.post(url, {});
  return result.data;
}

getSocketEndPoint = async function(type, baseURL, environment, sign) {
  let r;
  if (type == 'private') {
    r = await getPrivateWsToken(baseURL, sign);
  } else {
    r = getPublicWsToken(baseURL)
  }
  let token = r.data.token;
  let instanceServer = r.data.instanceServers[0]

  if(instanceServer){
    if (environment === 'sandbox') {
      return `${instanceServer.endpoint}?token=${token}&[connectId=${Date.now()}]`
    } else if (environment === 'live') {
      return `${instanceServer.endpoint}?token=${token}&[connectId=${Date.now()}]`
    } else {
      throw Error('No Kucoin  WS servers running')
    }
  }
}

/*  
  Initiate a websocket
  params = {
    topic: enum 
    symbols: array [optional depending on topic]
  }
  eventHanlder = function
*/

Sockets.initSocket = async function(params, eventHandler) {
  try {
    if ( !params.sign ) params.sign = false;
    if ( !params.endpoint ) params.endpoint = false;
    let [topic, endpoint, type] = Sockets.topics ( params.topic, params.symbols, params.endpoint, params.sign )
    let sign = this.sign('/api/v1/bullet-private', {}, 'POST');
    let websocket = await getSocketEndPoint(type, this.baseURL, this.environment, sign )
    let ws = new WebSocket(websocket);
    Sockets.ws[topic] = ws;
    ws.on('open', () => {
      console.log(topic + ' opening websocket connection... ');
      Socket.subscribe(topic, endpoint, type, eventHandler);
      Sockets.ws[topic].heartbeat = setInterval(Sockets.socketHeartBeat, 2000, topic)
    });
    ws.on('error', (error) => {
      Sockets.handleSocketError(error);
      console.log(error);
    });
    ws.on('ping', () => {
      return
    });
    ws.on('close', () => {
      clearInterval(Sockets.ws[topic].heartbeat)
      console.log(topic + ' websocket closed... ')
    });
  } catch (err) {
    console.log(err)
  }
}

Sockets.handleSocketError = function(error) {
  console.log('WebSocket error: ' + (error.code ? ' (' + error.code + ')' : '') +
  (error.message ? ' ' + error.message : '')); 
}

Sockets.socketHeartBeat = function(topic) {
  let ws = Socket.ws[topic];
  ws.ping();
};

Sockets.topics = function( topic, symbol = [], endpoint = false, sign = false) {
  if ( endpoint ) return [topic, endpoint + ( symbols.lenght > 0 ? ':' : '' ), sign ? 'private' : 'public']
  if ( topic === 'ticker' ) {
    return [topic, "/market/ticker:" + symbol.join( ',' ), 'public']
  }
}

console.log(Sockets)
