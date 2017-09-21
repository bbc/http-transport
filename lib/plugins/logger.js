'use strict';

const _ = require('lodash');

function isRetry(ctx) {
  return _.get(ctx, 'res.retries', []).length > 0;
}

function isCriticalError(ctx) {
  return ctx.res.statusCode >= 500;
}

function hasElapsedTime(ctx) {
  return !_.isUndefined(_.get(ctx, 'res.elapsedTime'));
}

function getBaseMessage(ctx) {
  return `${ctx.req.getMethod()} ${ctx.req.getUrl()} ${ctx.res.statusCode}`;
}

function createRequestMessage(ctx) {
  const res = ctx.res;

  const message = getBaseMessage(ctx);
  if (hasElapsedTime(ctx)) return `${message} ${res.elapsedTime} ms`;

  return message;
}

function createRetryMessage(ctx) {
  const res = ctx.res;
  const attempts = res.retries;

  const message = `Attempt ${attempts.length} ${getBaseMessage(ctx)}`;
  if (hasElapsedTime(ctx)) return `${message} ${res.elapsedTime} ms`;

  return message;
}

module.exports = (customLogger) => {
  const logger = customLogger || console;

  return (ctx, next) => {
    return next()
      .then(() => {
        if (isRetry(ctx) && isCriticalError(ctx)) {
          return logger.warn(createRetryMessage(ctx));
        }
        logger.info(createRequestMessage(ctx));
      });
  };
};
