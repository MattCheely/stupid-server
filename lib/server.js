'use strict';
var express = require('express');
var flatten = require('./flatten');
var http = require('http');
var proxy = require('./proxy');
var serveIndex = require('serve-index');
var serveStatic = require('serve-static');

var defaults = {
    port: 8080,
    path: process.cwd(),
    host: 'localhost',
    flatten: false,
    proxies: []
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

    return options;
}

module.exports = exports = function server(opts) {
    var app = express();
    var options = combineDefaults(opts);
    var proxies = options.proxies;
    var httpServer = http.createServer(app);

    for (var i = 0; i < proxies.length; i++) {
        console.log('Proxying ' + proxies[i].path + ' to ' + proxies[i].destination);
        app.use(proxy(proxies[i].path, proxies[i].destination, httpServer));
    }

    if (options.flatten) {
        app.use(flatten());
    }

    app.use(serveStatic(options.path));
    app.use(serveIndex(options.path));

    httpServer.listen(options.port, options.host);

    //TODO: For reals logging
    console.log('Listening on ' + options.host + ':' + options.port + '...');
};
