'use strict';
var express = require('express');
var flatten = require('./flatten');
var http = require('http');
var https = require('https');
var pem = require('pem');
var fs = require('fs');
var proxy = require('./proxy');
var serveIndex = require('serve-index');
var serveStatic = require('serve-static');

var HTTPS_PORT = 8443;

var defaults = {
    flatten: false,
    host: 'localhost',
    path: process.cwd(),
    port: 8080,
    proxies: [],
    secure: false,
    cert: null,
    key: null,
    insecureProxy: false,
    app: null
};

function combineDefaults(opts) {
    var options = {};
    for (var key in defaults) {
        if (opts[key] === undefined) {
            options[key] = defaults[key];
        } else {
            options[key] = opts[key];
        }
    }

    if (options.secure && !opts.port) {
        options.port = HTTPS_PORT;
    }

    return options;
}

function getCertificate (options, callback) {
    if (options.cert && options.key) {
        // stupid-server means reading files synchronously
        var cert = fs.readFileSync(options.cert, 'utf-8');
        var key = fs.readFileSync(options.key, 'utf-8');
        console.log('Using certificate', options.cert);
        callback(null, {
            serviceKey: key,
            certificate: cert
        });
    } else {
        pem.createCertificate({days:1, selfSigned:true}, function(err, keys){
            if (err) {
                callback(err);
            } else {
                callback(null, keys);
            }
        });
    }
}

function createServer (options, app, callback) {
    if (options.secure) {
        getCertificate(options, function(err, keys) {
            if (err) {
                callback(err);
            } else {
                callback(null, https.createServer({key: keys.serviceKey, cert: keys.certificate}, app));
            }
        });
    } else {
        callback(null, http.createServer(app));
    }
}

function setupProxies(server, app, options) {
    var proxies = options.proxies;
    for (var i = 0; i < proxies.length; i++) {
        console.log('Proxying ' + proxies[i].path + ' to ' + proxies[i].destination);
        console.log(options);
        app.use(proxy(server, {
            targetPath: proxies[i].path,
            destinationUrl: proxies[i].destination,
            stripSecure: !options.secure,
            insecure: options.insecureProxy
        }));
    }
}

module.exports = exports = function server(opts, callback) {
    var options = combineDefaults(opts);
    var app = options.app || express();

    createServer(options, app, function (err, server) {
        if (err) {
            callback(err);
            return;
        }

        setupProxies(server, app, options);

        if (options.flatten) {
            app.use(flatten());
        }

        app.use(serveStatic(options.path));
        app.use(serveIndex(options.path));

        server.listen(options.port, options.host);

        //TODO: For reals logging
        console.log('Listening on ' + options.host + ':' + options.port + '...');

        callback(null, server, app);
    });

};

module.exports.flatten = flatten;
module.exports.proxy = proxy;
