var httpProxy = require('http-proxy')

var proxy = httpProxy.createProxy();

var options = {  
  'digidoc.rodekruis.nl': 'localhost:3000'
}

require('http').createServer(function(req, res) {  
  proxy.web(req, res, {
    target: options[req.headers.host]
  });
}).listen(80);

// Logging initialization
console.log('Application started on port 80');