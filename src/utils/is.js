const regexes = {
  ipv4: /^(?:(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/,
  ipv6: /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i,
};

/**
 * Helper function which reverses the sense of predicate result
 * @param {*} func
 * @returns
 */
function negate(predicateFunc) {
  return function () {
    return !predicateFunc.apply(null, Array.prototype.slice.call(arguments));
  };
}

/**
 * @param {*} value - The value to test
 * @returns {boolean} True if the value is defined, otherwise false
 */
function existy(value) {
  return value !== null;
}

/**
 * @param {*} value - The value to test
 * @returns {boolean} True if the value is an IP address, otherwise false
 */
function ip(value) {
  return (
    (existy(value) && regexes.ipv4.test(value)) || regexes.ipv6.test(value)
  );
}

/**
 * @param {*} value - The value to test
 * @returns {boolean} True if the value is an object, otherwise false
 */
function object(value) {
  return Object(value) === value;
}

/**
 * @param {*} value - The value to test
 * @returns True if the value is a string, otherwise false
 */
function string(value) {
  return Object.prototype.toString.call(value) === "[object String]";
}

const is = {
  existy: existy,
  ip: ip,
  object: object,
  string: string,
  negate: {
    existy: negate(existy),
    ip: negate(ip),
    object: negate(object),
    string: negate(string),
  },
};

module.exports = is;
