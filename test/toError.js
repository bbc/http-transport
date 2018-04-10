'use strict';

function toError() {
    return async (ctx, next) => {
        await next();

        if (ctx.res.statusCode >= 400) {
            const err = new Error('something bad happend.');
            err.statusCode = ctx.res.statusCode;
            err.headers = ctx.res.headers;
            throw err;
        }
    };
}

module.exports = toError;
