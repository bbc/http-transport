const jsonRegex = /^application\/([a-z0-9-+]+)?json/;

function isJsonContentType(contentType) {
  return jsonRegex.test(contentType);
}

module.exports = (opts) => {
  opts = opts || {};
  const throwOnConflict = opts.throwOnConflict;
  const force = opts.force;

  return (ctx, next) => {
    return next().then(() => {
      const contentType = ctx.res.headers['content-type'];
      const isJson = isJsonContentType(contentType);
      if (force || isJson) {
        try {
          ctx.res.body = JSON.parse(ctx.res.body);
        } catch (err) {
          throw new Error(`JSON parsing failure: ${err.message}`);
        }
      }

      if (!isJson && throwOnConflict) throw new Error(`expected a json content type got ${contentType}`);
    });
  };
};
