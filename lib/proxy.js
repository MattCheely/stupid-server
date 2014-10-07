var url = require('url');
var httpProxy = require('http-proxy');

module.exports = exports = function proxy (targetPath, destinationUrl) {
    var proxy = httpProxy.createProxyServer();
    var destUrl = url.parse(destinationUrl);
    var targetRegExp = new RegExp('^' + targetPath);

    function shouldHandle(req) {
        return targetRegExp.test(req.path);
    }

    function stripTargetPath(req) {
        req.path = req.path.replace(targetRegExp, '');
    }

    function proxyHandler(req, res, next) {
        if (!shouldHandle(req)) {
            return next();
        }

        req.headers.host = destUrl.host;  //keep the outgoing requests sane
        delete req.headers.origin;  //eat shit, CORS

        proxy.web(req, res, {target: destinationUrl});
    }


    proxy.on('proxyReq', function (proxyReq, req, res) {
        stripTargetPath(proxyReq);
    });

    return proxyHandler;
}
