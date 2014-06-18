#!/usr/bin/env node
var express = require('express');
var serveStatic = require('serve-static');
var serveIndex = require('serve-index');
var app = express();

var port = 8080;
var path = process.cwd();
var host = 'localhost';

var args = process.argv.slice(2);
args.forEach(function (arg, idx, args) {
    if (arg === '-p' || arg === '--port') {
        port = args[idx+1];
    } else if (arg === '-h' || arg === '--host') {
        host = args[idx+1];
    } else {
        path = arg;
    }
});


app.use(serveStatic(path));
app.use(serveIndex(path));
app.listen(port, host);
console.log("Listening on port " + port + "...");
