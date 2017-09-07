'use strict'

function createMessage(ctx) {
  const res = ctx.res;
  let message = `${ctx.req.getMethod()} ${ctx.req.getUrl()} ${res.statusCode}`
  if (!isNaN(res.elapsedTime)) message += ` ${res.elapsedTime} ms`;
  return message;
}

module.exports = (customLogger) => {
  const logger = customLogger || console;

  return (ctx, next) => {
    return next().then(() => {
      logger.info(createMessage(ctx));
    });
  };
};
