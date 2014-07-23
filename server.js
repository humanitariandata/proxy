var httpProxy = require('http-proxy'),
    http = require('http'),
    url = require('url'),
    glob = require('glob'),
    request = require('request');
    
    /**
     * Before we begin, lets set the environment variable
     * We'll Look for a valid NODE_ENV variable and if one cannot be found load the development NODE_ENV
     */
    glob('./config/env/' + process.env.NODE_ENV + '.json', {
        sync: true
    }, function(err, environmentFiles) {
    	console.log();
    	if (!environmentFiles.length) {
    		if(process.env.NODE_ENV) {
    			console.log('\x1b[31m', 'No configuration file found for "' + process.env.NODE_ENV + '" environment using development instead');
    		} else {
    			console.log('\x1b[31m', 'NODE_ENV is not defined! Using default development environment');
    		}

    		process.env.NODE_ENV = 'development';
    	} else {
    		console.log('\x1b[7m', 'Application loaded using the "' + process.env.NODE_ENV + '" environment configuration');
    	}
    	console.log('\x1b[0m');
    });

var config = require('./config/env/' + process.env.NODE_ENV);

if (config.multipleApplications) {
   var proxy = httpProxy.createProxy();
 
   http.createServer(function(req, res) {  
     proxy.web(req, res, {
       target: config.options[req.headers.host]
     });
   }).listen(80);
   
   // Logging initialization
   console.log('Node application routing proxy started on port 80');
}

if (config.forwardingProxy) {
   //
   // Create a proxy server which handles GIS proxy requests to remote servers
   //
   //var forwardingProxy = httpProxy.createProxyServer({target: { protocol: 'http:' }});
   
   //
   // Create your custom server and just call `proxy.web()` to proxy
   // a web request to the target passed in the options
   // also you can use `proxy.ws()` to proxy a websockets request
   //
   var server = http.createServer(function(req, res) {
      // You can define here your custom logic to handle the request
      // and then proxy the request.
     
      var parameters = url.parse(req.url,true).query;
     
      
      request.get(decodeURIComponent(parameters.url), function (error, response, body) {
         if (!error && response.statusCode == 200) {
            res.setHeader('Access-Control-Allow-Origin', config.allowedDomains);
            res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.writeHead(200, { 'Content-Type': 'application/json' });
	    res.end(body, 'utf-8');
         }
      });
           
     //forwardingProxy.web(req, res, { forward: parameters.url });
   });
   
   server.listen(config.forwardingProxyPort);
   /*
   //
   // Listen for the `error` event on `forwardingProxy`.
   forwardingProxy.on('error', function (err, req, res) {
     res.writeHead(500, {
       'Content-Type': 'text/plain'
     });
   
     res.end('Something went wrong with passing the request url through the proxy.');
   });
   
   //
   // Listen for the `proxyRes` event on `forwardingProxy`.
   //
   forwardingProxy.on('proxyRes', function (res) {
     console.log('RAW Response from the target', JSON.stringify(res.headers, true, 2));
   });
   */
   
   console.log("Forwarding proxy listening on port " + config.forwardingProxyPort);
}