const geoip = require("geoip-lite");

const getClientIp = (req) => {
  if (!req) return null;
  const ip =
    req.ip ||
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    null;

  return ip;
};

module.exports = (req, res, next) => {
  const ip = getClientIp(req);
  const array = ip.split(":");

  let ipAddress = "";
  if (array.length) {
    ipAddress = array[array.length - 1];
  } else {
    ipAddress = ip;
  }

  if (ipAddress === "1") {
    req.ipAddress = "127.0.0.1";
  } else {
    req.ipAddress = ipAddress || "";
  }

  const geo = geoip.lookup(req.ipAddress);

  if (!geo) {
    req.country = "Unknown";
    req.location = "Unknown";
    req.locationDetails = {
      country: "",
      region: "",
      eu: "",
      timezone: "",
      city: "",
      ll: [],
    };
  } else {
    req.country = geo.country || "Unknown";
    req.location = `${geo.city} ${geo.country}`;
    req.locationDetails = {
      country: geo?.country || "",
      region: geo?.region || "",
      eu: geo?.eu || "",
      timezone: geo?.timezone || "",
      city: geo?.city || "",
      ll: geo?.ll || "",
    };
  }

  next();
};
