'use strict';
var vows = require('vows');
var assert = require('assert');
var path = require('path');
var flatten = require('../lib/flatten');

var FLATTEN_ROOT = '/path';
var MATCHING_URL = '/path/will/flatten';
var RELATIVE_PATH = 'some/asset.css';
var MATCHING_REFERRER = 'http://localhost/path/referrer';
var NOT_MATCHING_URL = '/';
var HOST = 'localhost';

function buildRequest(properties) {
    var req = {};
    req.headers = {};
    req.headers.host = HOST;
    req.headers.referer = properties.referer || null;
    req.url = properties.url;
    return req;
}

function noop() {}

var handler = flatten(FLATTEN_ROOT);
function flattenRequest(req) {
    var request = buildRequest(req);
    handler(request, {}, noop);
    return request;
}

vows.describe('The flatten middleware').addBatch({
    'When inititalized with not root path option': {
        topic: function() {
            var req = buildRequest({
                url: MATCHING_URL
            });
            flatten()(req, {}, noop);
            return req;
        },
        'flattens to /': function (req) {
            assert.equal('/', req.url);
        }
    },
    'On request that have no referer': {
        topic: flattenRequest({
            url: MATCHING_URL
        }),
        'flattens to the flatten root': function (req) {
            assert.equal(FLATTEN_ROOT, req.url);
        }
    },

    'On requests with a URL that\'s under the referrer header path (relative path request)': {
        topic: flattenRequest({
            url: path.join(MATCHING_URL, RELATIVE_PATH),
            referer: 'http://' + HOST + MATCHING_URL
        }),
        'flattens relative to the flatten root': function (req) {
            var expected = path.join(FLATTEN_ROOT, RELATIVE_PATH);
            assert.equal(expected, req.url);
        }
    },

    'On requests with a URL that\'s not under the referrer header path (absolute path request)': {
        topic: flattenRequest({
            url: path.join(MATCHING_URL, RELATIVE_PATH),
            referer: MATCHING_REFERRER
        }),
        'does nothing': function (req) {
            var expected = path.join(MATCHING_URL, RELATIVE_PATH);
            assert.equal(expected, req.url);
        }
    },

    'On requests with a referrer from a different host': {
        topic: flattenRequest({
            url: path.join(MATCHING_URL, RELATIVE_PATH),
            referer: 'http://otherhost.com' + MATCHING_URL
        }),
        'flattens to the flatten root': function (req) {
            assert.equal(FLATTEN_ROOT, req.url);
        }
    },

    'On requests with a URL that\'s not under the referrer header path': {
        topic: flattenRequest({
            url: path.join(MATCHING_URL, RELATIVE_PATH),
            referer: 'http://' + HOST + MATCHING_URL
        }),
        'flattens relative to the flatten root': function (req) {
            var expected = path.join(FLATTEN_ROOT, RELATIVE_PATH);
            assert.equal(expected, req.url);
        }
    },

    'On requests that aren\'t under the configured path': {
        topic: flattenRequest({
            url: NOT_MATCHING_URL
        }),
        'has no effect': function (req) {
            assert.equal(NOT_MATCHING_URL, req.url);
        }
    }
}).export(module);
