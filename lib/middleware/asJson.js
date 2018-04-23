'use strict';

const jsonRegex = /^application\/([a-z0-9-+]+)?json/;

function isJsonContentType(contentType) {
  return jsonRegex.test(contentType);
}

function isObject(val) {
  return typeof val === 'object';
}

module.exports = (opts) => {
  opts = opts || {};
  const throwOnConflict = opts.throwOnConflict;
  const force = opts.force;

  return async (ctx, next) => {
    await next();

    const contentType = ctx.res.headers['content-type'];
    const body = ctx.res.body;
    const isJson = isJsonContentType(contentType);
    const notParsed = !isObject(body);
    const validBody = (typeof body !== 'undefined' && body !== null);

    if ((force || isJson) && notParsed && validBody) {
      try {
        ctx.res.body = JSON.parse(ctx.res.body);
      } catch (err) {
        throw new Error(`JSON parsing failure: ${err.message}`);
      }
    }

    if (!isJson && throwOnConflict) throw new Error(`expected a json content type got ${contentType}`);
  };
};
