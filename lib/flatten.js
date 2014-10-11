'use strict';
var url = require('url');
var path = require('path');

module.exports = exports = function genFlattenHanlder(fRoot) {
    //Ignore the trailing slash on the provided path to simplify sub-path detection
    var flattenRoot = fRoot ? fRoot.replace(/\/$/, '') : '/';

    function flattenHandler(req, res, next) {
        var reqUrl = url.parse(req.url);
        reqUrl.host = req.headers.host;
        var refUrl = req.headers.referer ? url.parse(req.headers.referer) : null;

        if (!isUnderRoot(reqUrl.pathname)) {
            return next();
        }

        if (isExternal(reqUrl, refUrl)) {
            flatten(req);
        } else if (isRelative(reqUrl, refUrl)) {
            flattenRelative(req, refUrl);
        }

        next();
    }

    function isUnderRoot(path) {
        return path.indexOf(flattenRoot) === 0;
    }

    function isExternal(reqUrl, refUrl) {
        return !refUrl ||
            reqUrl.host !== refUrl.host ||
            !isUnderRoot(refUrl.pathname);
    }

    function isRelative(reqUrl, refUrl) {
        return reqUrl.pathname.indexOf(refUrl.pathname) === 0;
    }

    function flatten(req) {
        req.url = flattenRoot;
    }

    function flattenRelative(req, refUrl) {
        var reqUrl = url.parse(req.url);
        var rootRelativePath = path.relative(refUrl.pathname, reqUrl.pathname);
        reqUrl.pathname = path.join(flattenRoot, rootRelativePath);
        req.url = url.format(reqUrl);
    }

    return flattenHandler;
};
