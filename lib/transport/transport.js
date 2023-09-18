'use strict';

class Transport {
  toError(err, ctx) {
    return this.createError(err, ctx);
  }

  createError(err, ctx) {
    return new Error(`Request failed for ${ctx.req.getMethod()} ${ctx.req.getUrl()}: ${err.message}`);
  }

  async execute(ctx) {
    const opts = this.toOptions(ctx);

    try {
      const res = await this.makeRequest(ctx, opts);
      ctx.res = await this.toResponse(ctx, res);
    } catch (err) {
      throw this.toError(err, ctx);
    }
    return ctx;
  }

  toOptions() { }
  toResponse() { }
  makeRequest() { }
}

module.exports = Transport;
