var httpProxy = require('http-proxy'),
    http = require('http'),
    url = require('url'),
    glob = require('glob'),
    request = require('request'),
    https = require('https'),
    fs = require('fs'),
    secrets = require('./config/secrets'),
    path = require('path'),
    _ = require('underscore');
    
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
     
      var conf = {}; 
      for (var i in config.httpTargets) {
         var c = config.httpTargets[i];
         if (c.source === req.headers.host && c.sourcePort === config.m) {
            conf.target = c.target;
            conf.targetPort = c.targetPort;
         }
      }
      
      if (!_.isEmpty(conf)) {
         proxy.web(req, res, {
           target: conf.target + ':' + conf.targetPort
         });
      }
   }).listen(config.mainPort);
   
   proxy.on('error', function(e) {
      console.log('ERROR RESPONSE: ' + e);
    });
   
   proxy.on('proxyRes', function (res) {
      console.log('RAW Response from the target', JSON.stringify(res.headers, true, 2));
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

    if(config.hasOwnProperty('ca_file')){
              sslconfig.ca = fs.readFileSync(path.resolve(__dirname, config.ca_file), 'UTF-8');
    }
    
    // set passphrase in config
    if(secrets.certificate.passphrase) {
      sslconfig.passphrase = secrets.certificate.passphrase;
    }
    
    // Setting for self signed certificate
    sslconfig.rejectUnauthorized = false;
    
    // create proxy for SSL requests
    var proxySSL = httpProxy.createProxy();

    // Create https server to listen to requests
    https.createServer(sslconfig, function(req, res) {
      // proxy the requests to the right domain
      
      var conf = {}; 
      for (var i in config.httpsTargets) {
         var c = config.httpsTargets[i];
         if (c.source === req.headers.host && c.sourcePort === config.sslport) {
            conf.target = c.target;
            conf.targetPort = c.targetPort;
         }
      }
      
      if (!_.isEmpty(conf)) {
         proxySSL.web(req, res,
            {
               target: conf.target + ':' + conf.targetPort,
               ssl: sslconfig,
               secure: false,
               xfwd: true,
               agent: new https.Agent({ maxSockets: Infinity })
            });
      }
    }).listen(config.sslport);
    
    proxySSL.on('error', function(e) {
      console.log(e);
    });
    
    proxySSL.on('proxyRes', function (res) {
      console.log('RAW Response from the target', JSON.stringify(res.headers, true, 2));
    });
    
    // Logging initialization
    console.log('Node application routing proxy SSL started on port ' + config.sslport);
}
