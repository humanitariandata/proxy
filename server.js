var httpProxy = require('http-proxy'),
    http = require('http'),
    url = require('url') ;

var proxy = httpProxy.createProxy();

var options = {  
  'digidoc.rodekruis.nl': 'http://localhost:3000'
}

http.createServer(function(req, res) {  
  proxy.web(req, res, {
    target: options[req.headers.host]
  });
}).listen(80);

// Logging initialization
console.log('Node application routing proxy started on port 80');


//
// Create a proxy server which handles GIS proxy requests to remote servers
//
var forwardingProxy = httpProxy.createProxyServer({});

//
// Create your custom server and just call `proxy.web()` to proxy
// a web request to the target passed in the options
// also you can use `proxy.ws()` to proxy a websockets request
//
var server = http.createServer(function(req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  
  var parameters = url.parse(req.url,true).query;
  
  forwardingProxy.web(req, res, { target: parameters.url });
});

console.log("Forwarding proxy listening on port 81")
server.listen(5050);