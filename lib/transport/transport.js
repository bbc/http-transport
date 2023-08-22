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
      let res = await this.makeRequest(ctx, opts);
      ctx.res = await this.toResponse(ctx, res);
    } catch {
      this.onError(ctx);
    }
    return ctx;
    // return this.makeRequest(ctx, opts)
    //   .catch(this.onError(ctx))
    //   .then((res) => {
    //     ctx.res = this.toResponse(ctx, res);
    //     return ctx;
    //   });
  }

  onError(ctx) {
    return (err) => {
      throw this.toError(err, ctx);
    };
  }

  toOptions() { }
  toResponse() { }
  makeRequest() { }
}

module.exports = Transport;
