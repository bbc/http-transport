'use strict';

const _ = require('lodash');

function isRetry(ctx) {
  return _.get(ctx, 'res.retries', []).length > 0;
}

function hasElapsedTime(ctx) {
  return !_.isUndefined(_.get(ctx, 'res.elapsedTime'));
}

function createMessage(ctx) {
  const res = ctx.res;
  const attempts = res.retries;
  let message = `${ctx.req.getMethod()} ${ctx.req.getUrl()} ${res.statusCode}`;

  if (isRetry(ctx)) message = `Attempt ${attempts.length} ${message}`;
  if (hasElapsedTime(ctx)) message += ` ${res.elapsedTime} ms`;

  return message;
}

module.exports = (customLogger) => {
  const logger = customLogger || console;

  return (ctx, next) => {
    return next().then(() => {
      if (isRetry(ctx)) {
        return logger.warn(createMessage(ctx));
      }
      logger.info(createMessage(ctx));
    });
  };
};
