var httpProxy = require('http-proxy');

var options = { router: {
  'digidoc.rodekruis.nl'  : 'localhost:3000',
  // default route
  '.*'                    : 'localhost:3000'
}}

var router = new httpProxy.RoutingProxy(options);
var proxy = httpProxy.createServer(function(req,res) {
    console.log("request: " + req.path + "; method: " + req.method);
    router.proxyRequest(req,res);
});

proxy.listen(80, function() { console.log("Routing proxy listening on " + proxy.address().port); });

// Logging initialization
console.log('Application started on port 80');