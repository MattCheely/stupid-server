#!/usr/bin/env node
var program = require('commander');
var server = require('./lib/server');

program
    .option('-h, --host [hostname]', 'set the host to listen on [localhost]')
    .option('-p, --port [portnum]', 'set the port to listen on [8080]', parseInt)
    .option('-f, --flatten', 'flatten requests for html or directories to the server root.')
    .usage('[options] [path-to-host]');

program.on('--help', function () {
    console.log('  Notes:');
    console.log('');
    console.log('    If no path is specified, the CWD will be used');
    console.log('');
    console.log('    The --flatten option is primarily useful for single page js apps that use');
    console.log('    the history api to create natural URIs rather than hash based routes');
})

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
options.path = program.args[0];

console.log(options);
server(options);
