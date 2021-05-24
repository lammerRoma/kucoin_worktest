const http = require('http')
const url = require('url')

const App = require('./main')

const PORT = 9001;

const app = new App('BTC', 'USDT');
app.initSocket()

const server = http.createServer( (req, res) => {
  const baseURL = 'http://' + req.headers.host + '/';
  const reqUrl = new URL(req.url,baseURL);
  const pathName = reqUrl.pathname;

  if (pathName == '/get') {
    app.getData(res);
  } 
})

server.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});