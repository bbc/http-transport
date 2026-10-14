'use strict';

module.exports = (opts, path) => {
  return (ctx, next) => {
    const keys = path.split('.');
    let target = ctx;

    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        target[key] = opts;
        return;
      }

      if (
        target[key] === undefined ||
        target[key] === null ||
        typeof target[key] !== 'object'
      ) {
        target[key] = {};
      }

      target = target[key];
    });

    return next();
  };
};
