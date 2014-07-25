var httpProxy = require('http-proxy'),
    http = require('http'),
    url = require('url'),
    glob = require('glob'),
    request = require('request'),
    https = require('https'),
    fs = require('fs'),
    secrets = require('./config/secrets'),
    path = require('path');
    
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

// Get production or development config
var config = require('./config/env/' + process.env.NODE_ENV);

if (config.startHttpProxy) {
   // Create http proxy
   var proxy = httpProxy.createProxy({target: { protocol: 'http:'}});
   
   // Start http server
   http.createServer(function(req, res) {
     // proxy requests to the target url that matches the current request url
     proxy.web(req, res, {
       target: config.options[req.headers.host]
     });
   }).listen(config.mainPort);
   
   // Listen for the `error` event on `proxy`.
   proxy.on('error', function (err, req, res) {
     console.log('Error from the proxy ' + err);
   });
   
   // Logging initialization
   console.log('Node application routing proxy started on port ' + config.mainPort);
}

// set certicicates and start SSL server
if (config.startHttpsProxy) {
    
    // prepare config with ssl keys and settings
    var sslconfig = {};
    if(config.hasOwnProperty('pfx_file')){
        sslconfig.pfx = fs.readFileSync(path.resolve(__dirname, config.pfx_file), 'UTF-8');
    }
    else if (config.hasOwnProperty('key_file') && config.hasOwnProperty('cert_file')){
        sslconfig.key = fs.readFileSync(path.resolve(__dirname, config.key_file), 'UTF-8');
        sslconfig.cert = fs.readFileSync(path.resolve(__dirname, config.cert_file), 'UTF-8');
    }
    
    // set passphrase in config
    if(secrets.certificate.passphrase) {
      sslconfig.passphrase = secrets.certificate.passphrase;
    }
    
    // Setting for self signed certificate
    sslconfig.rejectUnauthorized = false;
    sslconfig.secure = true;
    
    // create proxy for SSL requests
    var proxySSL = httpProxy.createProxy();
    

    
   // Listen for the `error` event on `proxy`.
   proxySSL.on('error', function (err, req, res) {
     console.log('Error from the proxy ' + err);
   });

    // Create https server to listen to requests
    https.createServer(sslconfig, function(req, res) {
      // proxy the requests to the right domain
      proxySSL.web(req, res,
         {
            target: config.options[req.headers.host],
            ssl: sslconfig,
            secure: false,
            xfwd: true,
            agent: new Agent({ maxSockets: Infinity })
         });
    }).listen(config.sslport);
    
    // Logging initialization
    console.log('Node application routing proxy SSL started on port ' + config.sslport);
}
