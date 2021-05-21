const http = require('http')

const app = require('./main')

const PORT = 9001;

const server = http.createServer( (req, res) => {
  res.end('Hello')
})

server.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});