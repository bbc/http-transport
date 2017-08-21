const bluebird = require('bluebird');

module.exports.promisifyAll = (obj, opts) => {
  return bluebird.promisifyAll(obj, opts);
};
