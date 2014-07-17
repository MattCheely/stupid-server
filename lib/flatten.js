var url = require('url');
var path = require('path');

function shouldFlattenRelative(req) {
    var referrer = req.headers.referer;
    var reqUrl = url.parse(req.url);
    var refUrl = referrer ? url.parse(req.headers.referer) : null;
    return refUrl &&
        refUrl.host === req.headers.host &&
        reqUrl.pathname.indexOf(refUrl.pathname) === 0;
}

module.exports = exports = function flatten (fPath) {
    var flattenTo = fPath || '/';
    return function (req, res, next) {
        var newUrl = flattenTo;

        //TODO: write some tests & handle cross-domain shared paths, etc.
        if (shouldFlattenRelative(req)) {
            var reqUrl = url.parse(req.url);
            var refUrl = url.parse(req.headers.referer);
            var reqPath = reqUrl.pathname;
            var refPath = refUrl.pathname;

            var reqUniquePath = path.relative(refPath, reqPath);
            reqUrl.pathname = path.join(flattenTo, reqUniquePath);
            newUrl = url.format(reqUrl);
        }

        req.url = newUrl;
        next();
    };
};
