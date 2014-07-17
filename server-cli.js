#!/usr/bin/env node
var server = require('./lib/server');

var options = {}

var args = process.argv.slice(2);
args.forEach(function (arg, idx, args) {
    if (arg === '-p' || arg === '--port') {
        options.port = args[idx+1];
    } else if (arg === '-h' || arg === '--host') {
        options.host = args[idx+1];
    } else if (arg === '-f' || arg === '--flatten') {
        options.flatten = true;
    } else {
        options.path = arg;
    }
});

server(options);
