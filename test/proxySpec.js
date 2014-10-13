'use strict';
var assert = require('assert');
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
        ws: sinon.spy()
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
    return proxyBuilder(TARGET_PATH, DESTINATION_URL, serverStub);
}

vows.describe('The proxy middleware').addBatch({
    'For requests that match the target path': {
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
