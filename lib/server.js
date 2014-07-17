#!/usr/bin/env node
var express = require('express');
var serveStatic = require('serve-static');
var serveIndex = require('serve-index');
var flatten = require('./flatten');

var defaults = {
    port: 8080,
    path: process.cwd(),
    host: 'localhost',
    flatten: false
}

function combineDefaults(opts) {
    options = {};
    for (key in defaults) {
        if (opts[key] === undefined) {
            options[key] = defaults[key];
        } else {
            options[key] = opts[key];
        }
    }

    return options;
}

module.exports = exports = function server (opts) {
    var options = combineDefaults(opts);
    var app = express();

    if (options.flatten) {
        app.use(flatten());
    }

    app.use(serveStatic(options.path));
    app.use(serveIndex(options.path));
    app.listen(options.port, options.host);

    //TODO: For reals logging
    console.log("Listening on " + options.host + ':' + options.port + "...");
}

