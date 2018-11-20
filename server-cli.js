#!/usr/bin/env node
'use strict';
var program = require('commander');
var server = require('./lib/server');

function collect(val, memo) {
    memo.push(val);
    return memo;
}

function parseProxyArg(proxyStr, memo) {
    var split = proxyStr.split('::');
    var proxyDetail = {
        path: split[0],
        destination: split[1]
    };
    return collect(proxyDetail, memo);
}

program
    .option('-f, --flatten', 'flatten requests for html or directories to the server root.')
    .option('-h, --host [hostname]', 'set the host to listen on [localhost]')
    .option('-p, --port [portnum]', 'set the port to listen on [8080], [8443] with --secure', parseInt)
    .option('-s, --secure', 'use https with an automatically generated self-signed certificate')
    .option('-x, --proxy <path::destinationUrl>', 'proxy requests under path to destination', parseProxyArg, [])
    .option('-c, --cert [certPath]>', 'use a specifc certificate for ssl')
    .option('-k, --key [keyPath]', 'key for provided certificate')
    .option('-i, --insecureProxy', 'ignore certificate errors on proxy destination')
    .usage('[options] [path to serve]');

program.on('--help', function () {
    console.log('  Notes:');
    console.log('');
    console.log('    If no path is specified, the CWD will be used');
    console.log('');
    console.log('    Multiple --proxy options can be specified');
    console.log('');
    console.log('    The --flatten option is primarily useful for single page js apps that use');
    console.log('    the history api to create natural URIs rather than hash based routes');
    console.log('    The -c (--cert) option must be combined with -k (key) with paths to the cert and key provided, respectively');
});

program.parse(process.argv);

function extractOptions(program) {
    return program.options.reduce(function (opts, optionDetail) {
        var optionName = optionDetail.long.replace(/^--/, '');
        if (program.hasOwnProperty(optionName)) {
            opts[optionName] = program[optionName];
        }
        return opts;
    }, {});
}

var options = extractOptions(program);
options.proxies = options.proxy; //keeps the js server api tidy
options.path = program.args[0];

server(options, function (err) {
    if (err) {
        throw err;
    }
});
