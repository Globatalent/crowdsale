const BigNumber = require("bignumber.js");

module.exports = function(number, units) {
  const bigNumber = new BigNumber(number);
  return bigNumber.div("1e" + units);
};
