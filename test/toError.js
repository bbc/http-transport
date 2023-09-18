function toError() {
  return async (ctx, next) => {
    await next();

    if (ctx.res.statusCode >= 400) {
      const err = new Error('something bad happened.');
      err.statusCode = ctx.res.statusCode;
      err.headers = ctx.res.headers;
      throw err;
    }
  };
}

export default toError;
