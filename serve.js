'use strict';

var http = require('http');
var https = require('https');
var certs = require('localhost.daplie.com-certificates');
var express = require('express');
var app = express();
var plainServer = http.createServer(app);
var tlsServer = https.createServer(certs, app);

var fs = require('fs');
var RSA = require('rsa-compat').RSA;
var config = require('./config.js');


function serve(keypair) {
  var pokeapp = require('./').create({ keypair: keypair });

  app.use('/', pokeapp);
  app.use('/static', express.static('./public/static'));
  app.use('/', express.static('./public/static'));


  plainServer.listen(3000, function () {
    console.log('Listening on http://127.0.0.1:' + plainServer.address().port);
  });

  tlsServer.listen(3443, function () {
    console.log('Listening on https://localhost.daplie.com:' + tlsServer.address().port);
  });
}


//
// Generate an RSA key for signing sessions, if it doesn't exist
//
fs.readFile(config.rsaKeyPath, 'ascii', function (err, privkey) {
  if (!err) {
    serve({ privateKeyPem: privkey, publicKeyPem: RSA.exportPublicPem({ privateKeyPem: privkey }) });
    return;
  }

  RSA.generateKeypair(1024, 65537, { pem: true, public: true }, function (err, keypair) {
    fs.writeFile(config.rsaKeyPath, keypair.privateKeyPem, 'ascii', function (err) {
      if (err) {
        console.error(err);
        return;
      }

      serve(keypair);
    });
  });
});
