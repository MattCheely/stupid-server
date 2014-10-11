'use strict';
var express = require('express');
var serveStatic = require('serve-static');
var serveIndex = require('serve-index');
var flatten = require('./flatten');
var proxy = require('./proxy');

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
    var options = combineDefaults(opts);
    var app = express();
    var proxies = options.proxies;

    for (var i = 0; i < proxies.length; i++) {
        console.log('Proxying ' + proxies[i].path + ' to ' + proxies[i].destination);
        app.use(proxy(proxies[i].path, proxies[i].destination));
    }

    if (options.flatten) {
        app.use(flatten());
    }

    app.use(serveStatic(options.path));
    app.use(serveIndex(options.path));
    app.listen(options.port, options.host);

    //TODO: For reals logging
    console.log('Listening on ' + options.host + ':' + options.port + '...');
};
