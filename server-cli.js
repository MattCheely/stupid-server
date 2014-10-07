#!/usr/bin/env node
var program = require('commander');
var server = require('./lib/server');

function collect(val, memo) {
  memo.push(val);
  return memo;
}

function parseProxyArg (proxyStr, memo) {
    var split = proxyStr.split('::');
    var proxyDetail = {
        path: split[0],
        destination: split[1]
    };
    return collect(proxyDetail, memo);
}

program
    .option('-h, --host [hostname]', 'set the host to listen on [localhost]')
    .option('-p, --port [portnum]', 'set the port to listen on [8080]', parseInt)
    .option('-x, --proxy <path::destinationUrl>', 'proxy requests under path to destination', parseProxyArg, [])
    .option('-f, --flatten', 'flatten requests for html or directories to the server root.')
    .usage('[options] [path-to-host]');

program.on('--help', function () {
    console.log('  Notes:');
    console.log('');
    console.log('    If no path is specified, the CWD will be used');
    console.log('');
    console.log('    Multiple --proxy options can be specified');
    console.log('');
    console.log('    The --flatten option is primarily useful for single page js apps that use');
    console.log('    the history api to create natural URIs rather than hash based routes');
});

program.parse(process.argv);

function extractOptions(program) {
    return program.options.reduce(function (opts, optionDetail) {
        var optionName = optionDetail.long.replace(/^--/, '');
        if (program.hasOwnProperty(optionName)) {
            opts[optionName] = program[optionName];
        }
        return opts;
    }, {})
}

var options = extractOptions(program);
options.proxies = options.proxy; //keeps the js server api tidy
options.path = program.args[0];

server(options);
