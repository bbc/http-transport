'use strict';

const _ = require('lodash');

module.exports = (opts, path) => {
  return (ctx, next) => {
    _.set(ctx, path, opts);
    return next();
  };
};
