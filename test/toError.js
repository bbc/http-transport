'use strict';

function toError() {
  return async (ctx, next) => {
    await next();

    if (ctx.res.status >= 400) {
      const err = new Error('something bad happened.');
      err.status = ctx.res.status;
      err.headers = ctx.res.headers;
      throw err;
    }
  };
}

module.exports = toError;
