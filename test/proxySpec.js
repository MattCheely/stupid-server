var proxy = require('../lib/proxy');
var assert = require('assert');
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var url = require('url');
var vows = require('vows');


var TARGET_PATH = "/foo/bar";
var DESTINATION_URI = "http://notaserver:4040/path";
var PARSED_DESTINATION = url.parse(DESTINATION_URI);

function buildHttpProxyStub() {
    var proxyServerStub = {
        web: sinon.spy(),
        on: sinon.spy()
    };

    var httpProxyStub = {
        createProxyServer: function () {
            return proxyServerStub;
        },
        proxyServerStub: proxyServerStub
    }

    return httpProxyStub;
}

function getMockedMiddleware(httpProxyStub) {
    var proxyBuilder = proxyquire('../lib/proxy', {'http-proxy': httpProxyStub});
    return proxyBuilder(TARGET_PATH, DESTINATION_URI);
}


vows.describe("The proxy middleware").addBatch({
    "For requests that match the target path": {
        topic: function() {
            var request = {
                path: '/foo/bar/baz',
                headers: {
                'origin': 'http://localhost/'
                }
            };
            var httpProxyStub = buildHttpProxyStub();
            var proxyFn = getMockedMiddleware(httpProxyStub);
            proxyFn(request);
            return httpProxyStub.proxyServerStub;
        },
        "the host header is set to match the destinaton host": function (proxyServerStub) {
            var req = proxyServerStub.web.lastCall.args[0];
            assert.equal(req.headers.host, PARSED_DESTINATION.host);
        },
        "the origin header is removed": function (proxyServerStub) {
            var req = proxyServerStub.web.lastCall.args[0];
            var containsOrigin = Object.keys(req.headers).indexOf('origin') >= 0;
            assert.isFalse(containsOrigin);
        },
        "on the outgoing proxy request": {
            topic: function (proxyServerStub) {
                var proxyReqHandler = proxyServerStub.on.lastCall.args[1];
                var proxyReq = {path: '/foo/bar/baz'}
                proxyReqHandler(proxyReq);
                return proxyReq;
            },
            "the target path is stripped": function (proxyReq) {
                assert.equal(proxyReq.path, '/baz');
            }
        }
    },
    "For requests that do not math the target path": {
        topic: function () {
            var request = {
                path: '/blargh'
            };
            var httpProxyStub = buildHttpProxyStub();
            var proxyFn = getMockedMiddleware(httpProxyStub);
            proxyFn(request, {}, function () {});
            return httpProxyStub.proxyServerStub.web;
        },
        "nothing is proxied": function (proxyFn) {
            assert.isFalse(proxyFn.called);
        }
    }
}).export(module);
