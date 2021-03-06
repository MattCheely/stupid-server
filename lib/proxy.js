"use strict";
var cookie = require("simple-cookie");
var httpProxy = require("http-proxy");
var url = require("url");

function joinPath(p1, p2) {
  return p1.replace(/\/?$/, "/") + p2.replace(/^\//, "");
}

function requestLogger(message, doLogging) {
  if (!doLogging) {
    return () => {};
  }
  return function(req) {
    const headers = req.headers || req.getHeaders();
    const headerStr = Object.keys(headers)
      .map(header => {
        return `  ${header}: ${headers[header]}`;
      })
      .sort()
      .join("\n");

    console.log(
      `
${message} ${headers.host}
${req.method} ${req.path}
${headerStr}
`
    );
  };
}

function verboseLogDelimiter() {
  console.log(`=======================================================`);
}

module.exports = exports = function genProxyHandler(server, options) {
  var destinationUrl = options.destinationUrl;
  var targetPath = options.targetPath;
  var proxy = httpProxy.createProxyServer({
    secure: !options.insecure,
    changeOrigin: true,
    hostRewrite: true,
    autoRewrite: true,
    prependPath: true,
    ws: true
  });
  var destUrl = url.parse(destinationUrl);
  var targetRegExp = new RegExp("^" + targetPath);

  var logInboundRequest = requestLogger("Inbound to", options.verbose);
  var logOutboundRequest = requestLogger("Outbound to", options.verbose);
  var logDelimiter = options.verbose ? verboseLogDelimiter : function() {};

  function shouldHandle(req) {
    var path = url.parse(req.url).path;
    return targetRegExp.test(path);
  }

  function cleanUpRequest(req) {
    var reqUrl = url.parse(req.url);
    reqUrl.pathname = reqUrl.pathname.replace(targetRegExp, "");
    req.url = url.format(reqUrl);
  }

  function pathMatchesDestination(path) {
    // match /foo to /foo/bar, but not /foobar
    var cookiePathWithSlash = path.replace(/\/?$/, "/");
    var destPathWithSlash = destUrl.pathname.replace(/\/?$/, "/");
    return (
      path.indexOf(destPathWithSlash) === 0 ||
      destUrl.pathname.indexOf(cookiePathWithSlash) === 0
    );
  }

  function translateCookie(cookieStr) {
    var cookieObj = cookie.parse(cookieStr);
    if (pathMatchesDestination(cookieObj.path)) {
      cookieObj.domain = "";
      if (options.stripSecure) {
        cookieObj.secure = false; //https? pfft.
      }
      if (destUrl.pathname.indexOf(cookieObj.path) === 0) {
        cookieObj.path = targetPath;
      } else {
        var destPathRegex = new RegExp("^" + destUrl.pathname);
        cookieObj.path = cookieObj.path.replace(destPathRegex, "");
        cookieObj.path = joinPath(targetPath, cookieObj.path);
      }
    }

    return cookie.stringify(cookieObj);
  }

  server.on("upgrade", function(req, socket, head) {
    if (shouldHandle(req)) {
      cleanUpRequest(req);
      proxy.ws(req, socket, head, { target: destinationUrl });
    }
  });

  proxy.on("proxyRes", function(proxyRes) {
    var cookies = proxyRes.headers["set-cookie"];
    if (cookies) {
      proxyRes.headers["set-cookie"] = cookies.map(translateCookie);
    }
  });

  proxy.on("proxyReq", function(proxyReq, req, res, options) {
    logDelimiter();
    logInboundRequest(req);
    logOutboundRequest(proxyReq);
    logDelimiter();
  });

  proxy.on("error", function(error, req, res) {
    res.status(500).json({
      errorType: "PROXY_ERROR",
      proxyHost: destinationUrl,
      message: error.message,
      stack: error.stack
    });
  });

  return function proxyHandler(req, res, next) {
    if (!shouldHandle(req)) {
      return next();
    }

    cleanUpRequest(req);
    proxy.web(req, res, {
      target: destinationUrl
    });
  };
};
