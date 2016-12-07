'use strict';
var assert = require('assert');
var sCookie = require('simple-cookie');
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var url = require('url');
var vows = require('vows');

var TARGET_PATH = '/foo/bar';
var DESTINATION_URL = 'http://notaserver:4040/path';
var PARSED_DESTINATION = url.parse(DESTINATION_URL);

function buildHttpProxyStub() {
    var proxyServerStub = {
        web: sinon.spy(),
        ws: sinon.spy(),
        on: sinon.spy()
    };

    var httpProxyStub = {
        createProxyServer: function () {
            return proxyServerStub;
        },
        proxyServerStub: proxyServerStub
    };

    return httpProxyStub;
}

function buildServerStub() {
    return {
        on: sinon.spy()
    };
}

function getMockedMiddleware(httpProxyStub, serverStub) {
    var proxyBuilder = proxyquire('../lib/proxy', {'http-proxy': httpProxyStub});
    return proxyBuilder(serverStub, {
        targetPath: TARGET_PATH,
        destinationUrl: DESTINATION_URL,
        stripSecure: true
    });
}

function getMockedSecureMiddleware(httpProxyStub, serverStub) {
    var proxyBuilder = proxyquire('../lib/proxy', {'http-proxy': httpProxyStub});
    return proxyBuilder(serverStub, {
        targetPath: TARGET_PATH,
        destinationUrl: DESTINATION_URL,
        stripSecure: false
    });
}

vows.describe('The proxy middleware').addBatch({
    'For requests that match the target path when the stripSecure flag is set': {
        topic: function () {
            var request = {
                headers: {},
                url: 'http://localhost:8080/foo/bar/baz'
            };
            var httpProxyStub = buildHttpProxyStub();
            var proxyFn = getMockedMiddleware(httpProxyStub, buildServerStub());
            proxyFn(request);
            return httpProxyStub.proxyServerStub.web.lastCall.args[0];
        },
        'the host header is set to match the destinaton host': function (req) {
            assert.equal(req.headers.host, PARSED_DESTINATION.host);
        },
        'the target path is stripped': function (req) {
            var reqUrl = url.parse(req.url);
            assert.equal(reqUrl.pathname, '/baz');

        },
        'On a proxy response without headers': {
            topic: function () {
                var httpProxyStub = buildHttpProxyStub();
                getMockedMiddleware(httpProxyStub, buildServerStub());
                var onRes = httpProxyStub.proxyServerStub.on.lastCall.args[1];
                var proxyRes = {
                    headers: {}
                };
                onRes(proxyRes);
                return proxyRes.headers;
            },
            'nothing blows up': function (headers) {
                assert.deepEqual(headers, {});
            }
        },
        'On the proxy response': {
            topic: function () {
                var httpProxyStub = buildHttpProxyStub();
                getMockedMiddleware(httpProxyStub, buildServerStub());
                var onRes = httpProxyStub.proxyServerStub.on.lastCall.args[1];
                var proxyRes = {
                    headers: {
                        'set-cookie': [
                            'foo=bar; Path=/path/test; Domain=notaserver; secure',
                            'baz=bar; Path=/; Domain=notaserver; secure',
                            'qux=bar; Path=/george; Domain=notaserver; secure'
                        ]
                    }
                };
                onRes(proxyRes);
                return proxyRes.headers['set-cookie'];
            },
            'cookies with paths that do not match the desination path': {
                topic: function (setCookies) {
                    return setCookies[2];
                },
                'are unchanged': function (cookie) {
                    assert.equal(cookie, 'qux=bar; Path=/george; Domain=notaserver; secure');
                }
            },
            'cookies that match the destination path': {
                topic: function (cookies) {
                    return cookies.slice(0, 2);
                },
                'have their domain cleared': function (setCookies) {
                    setCookies.slice(0, 2).forEach(function (cookieStr) {
                        var cookie = sCookie.parse(cookieStr);
                        assert.equal(cookie.domain, '');
                    });
                },
                'have the secure flag unset': function (setCookies) {
                    setCookies.slice(0, 2).forEach(function (cookieStr) {
                        var cookie = sCookie.parse(cookieStr);
                        assert.equal(cookie.secure, false);
                    });
                },
                'and are under the destination path': {
                    topic: function (setCookies) {
                        return setCookies[0];
                    },
                    'have the destination path is replaced with the target path': function (cookie) {
                        var cookieObj = sCookie.parse(cookie);
                        assert.equal(cookieObj.path, '/foo/bar/test');
                    }
                },
                'and are above the destination path': {
                    topic: function (setCookies) {
                        return setCookies[1];
                    },
                    'have their path mapped to the target path': function (cookie) {
                        var cookieObj = sCookie.parse(cookie);
                        assert.equal(cookieObj.path, '/foo/bar');
                    }
                }
            }
        }
    },
    'For requests that match the target path when the stripSecure flag is unset': {
        topic: function () {
            var request = {
                headers: {},
                url: 'http://localhost:8080/foo/bar/baz'
            };
            var httpProxyStub = buildHttpProxyStub();
            var proxyFn = getMockedMiddleware(httpProxyStub, buildServerStub());
            proxyFn(request);
            return httpProxyStub.proxyServerStub.web.lastCall.args[0];
        },
        'On the proxy response': {
            topic: function () {
                var httpProxyStub = buildHttpProxyStub();
                getMockedSecureMiddleware(httpProxyStub, buildServerStub());
                var onRes = httpProxyStub.proxyServerStub.on.lastCall.args[1];
                var proxyRes = {
                    headers: {
                        'set-cookie': [
                            'foo=bar; Path=/path/test; Domain=notaserver; secure',
                            'baz=bar; Path=/; Domain=notaserver; secure',
                            'qux=bar; Path=/george; Domain=notaserver; secure'
                        ]
                    }
                };
                onRes(proxyRes);
                return proxyRes.headers['set-cookie'];
            },
            'cookies that match the destination path': {
                topic: function (cookies) {
                    return cookies.slice(0, 2);
                },
                'do not have the secure flag unset': function (setCookies) {
                    setCookies.slice(0, 2).forEach(function (cookieStr) {
                        var cookie = sCookie.parse(cookieStr);
                        assert.equal(cookie.secure, true);
                    });
                },
            }
        }
    },
    'For requests that do not math the target path': {
        topic: function () {
            var request = {
                url: 'http://localhost:8080/blargh'
            };
            var httpProxyStub = buildHttpProxyStub();
            var proxyFn = getMockedMiddleware(httpProxyStub, buildServerStub());
            proxyFn(request, {}, function () {});
            return httpProxyStub.proxyServerStub.web;
        },
        'nothing is proxied': function (proxyFn) {
            assert.isFalse(proxyFn.called);
        }
    },
    'For upgrades that match the target path': {
        topic: function () {
            var request = {
                headers: {},
                url: 'http://localhost:8080/foo/bar/baz'
            };
            var httpProxyStub = buildHttpProxyStub();
            var serverStub = buildServerStub();
            getMockedMiddleware(httpProxyStub, serverStub);
            var upgradeHandler = serverStub.on.lastCall.args[1];
            upgradeHandler(request);
            return httpProxyStub.proxyServerStub.ws.lastCall.args[0];
        },
        'the host header is set to match the destinaton host': function (req) {
            assert.equal(req.headers.host, PARSED_DESTINATION.host);
        },
        'the target path is stripped': function (req) {
            var reqUrl = url.parse(req.url);
            assert.equal(reqUrl.pathname, '/baz');

        }
    },
    'For upgrades that do not match the target path': {
        topic: function () {
            var request = {
                headers: {},
                url: 'http://localhost:8080/blargh'
            };
            var httpProxyStub = buildHttpProxyStub();
            var serverStub = buildServerStub();
            getMockedMiddleware(httpProxyStub, serverStub);
            var upgradeHandler = serverStub.on.lastCall.args[1];
            upgradeHandler(request);
            return httpProxyStub.proxyServerStub.ws;
        },
        'nothing is proxied': function (proxyFn) {
            assert.isFalse(proxyFn.called);
        }
    }
}).export(module);
