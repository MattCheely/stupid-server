'use strict';
var url = require('url');
var httpProxy = require('http-proxy');

module.exports = exports = function genProxyHandler(targetPath, destinationUrl) {
    var proxy = httpProxy.createProxyServer();
    var destUrl = url.parse(destinationUrl);
    var targetRegExp = new RegExp('^' + targetPath);

    function shouldHandle(req) {
        return targetRegExp.test(req.path);
    }

    function stripTargetPath(req) {
        req.path = req.path.replace(targetRegExp, '');
    }

    var wsProxyInPlace = false;
    function configWsProxy(req) {
        if (!wsProxyInPlace) {
            var server = req.socket.server; //TODO: kludge less.
            server.on('upgrade', function (req, socket, head) {
                if (shouldHandle(req)) {
                    proxy.ws(req, socket, head);
                }
            });

            wsProxyInPlace = true;
        }
    }

    function proxyHandler(req, res, next) {
        configWsProxy(req);

        if (!shouldHandle(req)) {
            return next();
        }

        req.headers.host = destUrl.host;  //keep the outgoing requests sane

        proxy.web(req, res, {target: destinationUrl});
    }

    proxy.on('proxyReq', function (proxyReq /*req, res*/) {
        stripTargetPath(proxyReq);
    });

    return proxyHandler;
};
