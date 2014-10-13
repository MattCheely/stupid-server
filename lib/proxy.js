'use strict';
var url = require('url');
var httpProxy = require('http-proxy');

module.exports = exports = function genProxyHandler(targetPath, destinationUrl, server) {
    var proxy = httpProxy.createProxyServer();
    var destUrl = url.parse(destinationUrl);
    var targetRegExp = new RegExp('^' + targetPath);

    function shouldHandle(req) {
        var path = url.parse(req.url).path;
        return targetRegExp.test(path);
    }

    function cleanUpRequest(req) {
        var reqUrl = url.parse(req.url);
        reqUrl.pathname = reqUrl.pathname.replace(targetRegExp, '');
        req.url = url.format(reqUrl);

        req.headers.host = destUrl.host;
    }

    function proxyHandler(req, res, next) {
        if (!shouldHandle(req)) {
            return next();
        }

        cleanUpRequest(req);
        proxy.web(req, res, {target: destinationUrl});
    }

    server.on('upgrade', function (req, socket, head) {
        if (shouldHandle(req)) {
            cleanUpRequest(req);
            proxy.ws(req, socket, head, {target: destinationUrl});
        }
    });

    return proxyHandler;
};
