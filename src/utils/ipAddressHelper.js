const is = require("./is");

/**
 * Determine client IP address.
 * @param req
 * @returns {string} ip - The IP address if known, defaulting to empty string if unknown.
 */

// The user ip is determined by the following order:

//1. X-Client-IP
//2. X-Forwarded-For (Header may return multiple IP addresses in the format:     "client IP, proxy 1 IP, proxy 2 IP", so we take the first one.)
//3. CF-Connecting-IP (Cloudflare)
//4. Fastly-Client-Ip (Fastly CDN and Firebase hosting header when forwared to a cloud function)
//5. True-Client-Ip (Akamai and Cloudflare)
//6. X-Real-IP (Nginx proxy/FastCGI)
//7. X-Cluster-Client-IP (Rackspace LB, Riverbed Stingray)
//8. X-Forwarded, Forwarded-For and Forwarded (Variations of #2)
//9. appengine-user-ip (Google App Engine)
//10. req.connection.remoteAddress
//11. req.socket.remoteAddress
//12. req.connection.socket.remoteAddress
//13.  req.info.remoteAddress
//14. Cf-Pseudo-IPv4 (Cloudflare fallback)
//15. request.raw (Fastify)
//16. If an IP address cannot be found, it will return null.

function getClientIp(req) {
  // Server is probably behind a proxy.
  if (req.headers) {
    // Standard headers used by Amazon EC2, Heroku, and others.
    if (is.ip(req.headers["x-client-ip"])) {
      console.log("x-client-ip");
      return req.headers["x-client-ip"];
    }

    // Load-balancers (AWS ELB) or proxies.
    if (req.headers["x-forwarded-for"]) {
      const xForwardedFor = getClientIpFromXForwardedFor(
        req.headers["x-forwarded-for"]
      );

      if (is.ip(xForwardedFor)) {
        console.log("x-forwarded-for");
        return xForwardedFor;
      }
    }

    // Cloudflare.
    // @see https://support.cloudflare.com/hc/en-us/articles/200170986-How-does-Cloudflare-handle-HTTP-Request-headers-
    // CF-Connecting-IP - applied to every request to the origin.
    if (is.ip(req.headers["cf-connecting-ip"])) {
      console.log("cf-connecting-ip");
      return req.headers["cf-connecting-ip"];
    }

    // DigitalOcean.
    // @see https://www.digitalocean.com/community/questions/app-platform-client-ip
    // DO-Connecting-IP - applied to app platform servers behind a proxy.
    if (is.ip(req.headers["do-connecting-ip"])) {
      console.log("do-connecting-ip");
      return req.headers["do-connecting-ip"];
    }

    // Fastly and Firebase hosting header (When forwared to cloud function)
    if (is.ip(req.headers["fastly-client-ip"])) {
      console.log("fastly-client-ip");
      return req.headers["fastly-client-ip"];
    }

    // Akamai and Cloudflare: True-Client-IP.
    if (is.ip(req.headers["true-client-ip"])) {
      console.log("true-client-ip");
      return req.headers["true-client-ip"];
    }

    // Default nginx proxy/fcgi; alternative to x-forwarded-for, used by some proxies.
    if (is.ip(req.headers["x-real-ip"])) {
      console.log("x-real-ip");
      return req.headers["x-real-ip"];
    }

    // (Rackspace LB and Riverbed's Stingray)
    // http://www.rackspace.com/knowledge_center/article/controlling-access-to-linux-cloud-sites-based-on-the-client-ip-address
    // https://splash.riverbed.com/docs/DOC-1926
    if (is.ip(req.headers["x-cluster-client-ip"])) {
      console.log("x-cluster-client-ip");
      return req.headers["x-cluster-client-ip"];
    }

    if (is.ip(req.headers["x-forwarded"])) {
      console.log("x-forwarded");
      return req.headers["x-forwarded"];
    }

    if (is.ip(req.headers["forwarded-for"])) {
      console.log("forwarded-for");
      return req.headers["forwarded-for"];
    }

    if (is.ip(req.headers.forwarded)) {
      console.log("(req.headers.forwarded");
      return req.headers.forwarded;
    }

    // Google Cloud App Engine
    // https://cloud.google.com/appengine/docs/standard/go/reference/request-response-headers
    if (is.ip(req.headers["x-appengine-user-ip"])) {
      console.log("x-appengine-user-ip");
      return req.headers["x-appengine-user-ip"];
    }
  }

  // Remote address checks.
  // Deprecated
  if (is.existy(req.connection)) {
    if (is.ip(req.connection.remoteAddress)) {
      console.log("req.connection.remoteAddress");
      return req.connection.remoteAddress;
    }
    if (
      is.existy(req.connection.socket) &&
      is.ip(req.connection.socket.remoteAddress)
    ) {
      console.log("req.connection.socket.remoteAddress");
      return req.connection.socket.remoteAddress;
    }
  }

  if (is.existy(req.socket) && is.ip(req.socket.remoteAddress)) {
    console.log("req.socket.remoteAddress");
    return req.socket.remoteAddress;
  }

  if (is.existy(req.info) && is.ip(req.info.remoteAddress)) {
    console.log("req.info.remoteAddress");
    return req.info.remoteAddress;
  }

  // AWS Api Gateway + Lambda
  if (
    is.existy(req.requestContext) &&
    is.existy(req.requestContext.identity) &&
    is.ip(req.requestContext.identity.sourceIp)
  ) {
    console.log("req.requestContext.identity.sourceIp");
    return req.requestContext.identity.sourceIp;
  }

  // Cloudflare fallback
  // https://blog.cloudflare.com/eliminating-the-last-reasons-to- negate-enable-ipv6/#introducingpseudoipv4
  if (req.headers) {
    if (is.ip(req.headers["Cf-Pseudo-IPv4"])) {
      console.log("Cf-Pseudo-IPv4");
      return req.headers["Cf-Pseudo-IPv4"];
    }
  }

  // Fastify https://www.fastify.io/docs/latest/Reference/Request/
  if (is.existy(req.raw)) {
    console.log("req.raw");
    return getClientIp(req.raw);
  }

  console.log("No IP found");
  return null;
}

/**
 * Parse x-forwarded-for headers.
 * @param {string} value - The value to be parsed.
 * @return {string|null} First known IP address, if any.
 */
function getClientIpFromXForwardedFor(value) {
  if (!is.existy(value)) {
    return null;
  }

  if (is.negate.string(value)) {
    throw new TypeError(`Expected a string, got "${typeof value}"`);
  }

  // x-forwarded-for may return multiple IP addresses in the format:
  // "client IP, proxy 1 IP, proxy 2 IP"
  // Therefore, the right-most IP address is the IP address of the most recent proxy
  // and the left-most IP address is the IP address of the originating client.
  // source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For
  // Azure Web App's also adds a port for some reason, so we'll only use the first part (the IP)
  const forwardedIps = value.split(",").map((e) => {
    const ip = e.trim();
    if (ip.includes(":")) {
      const splitted = ip.split(":");
      // make sure we only use this if it's ipv4 (ip:port)
      if (splitted.length === 2) {
        return splitted[0];
      }
    }
    return ip;
  });

  // Sometimes IP addresses in this header can be 'unknown' (http://stackoverflow.com/a/11285650).
  // Therefore taking the right-most IP address that is  negate unknown
  // A Squid configuration directive can also set the value to "unknown" (http://www.squid-cache.org/Doc/config/forwarded_for/)
  for (let i = 0; i < forwardedIps.length; i++) {
    if (is.ip(forwardedIps[i])) {
      return forwardedIps[i];
    }
  }

  // If no value in the split list is an ip, return null
  return null;
}

module.exports = {
  getClientIp,
  getClientIpFromXForwardedFor,
};
