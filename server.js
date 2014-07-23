var httpProxy = require('http-proxy');

var server = httpProxy.createServer({
   router: {
     'digidoc.rodekruis.nl': 'localhost:3000'
   }
});

server.listen(80);

// Logging initialization
console.log('Application started on port ' + config.sslport);