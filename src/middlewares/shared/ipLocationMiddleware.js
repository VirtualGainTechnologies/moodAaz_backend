const { getClientIp } = require("../../utils/ipAddressHelper");
const geoip = require("geoip-lite");

exports.getIpAndLocation = (req, res, next) => {
  const ip = getClientIp(req);
  const array = ip.split(":");

  console.log("ip address ===>", ip);

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

  console.log("ip address formated:", req.ipAddress);

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
