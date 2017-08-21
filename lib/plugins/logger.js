function createMessage(ctx) {
  const res = ctx.res;
  return `${ctx.req.getMethod()} ${ctx.req.getUrl()} ${res.statusCode} ${res.elapsedTime} ms`;
}

module.exports = (customLogger) => {
  const logger = customLogger || console;

  return (ctx, next) => {
    return next().then(() => {
      logger.info(createMessage(ctx));
    });
  };
};
