'use strict';

function isRetry(ctx) {
  const attempts = ctx.retryAttempts || [];
  return attempts.length > 0;
}

function isCriticalError(ctx) {
  return ctx.res.status >= 500;
}

function getBaseMessage(ctx) {
  return `${ctx.req.getMethod()} ${ctx.req.getUrl()} ${ctx.res.status}`;
}

function createRetryMessage(ctx) {
  const attempts = ctx.retryAttempts;

  const message = `Attempt ${attempts.length} ${getBaseMessage(ctx)}`;
  return message;
}

module.exports = (customLogger) => {
  const logger = customLogger || console;

  return async (ctx, next) => {
    await next();

    if (isRetry(ctx) && isCriticalError(ctx)) {
      return logger.warn(createRetryMessage(ctx));
    }
    logger.info(getBaseMessage(ctx));
  };
};
