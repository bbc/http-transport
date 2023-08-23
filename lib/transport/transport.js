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
    let from;

    try {
      from = await this.makeRequest(ctx, opts);
    } catch {
      console.log('gets here')
      from = this.onError(ctx);
    }
    
    ctx.res = await this.toResponse(ctx, from);
    return ctx;

  //   return this.makeRequest(ctx, opts)
  //     .catch(this.onError(ctx))
  //     .then((res) => {
  //       ctx.res = this.toResponse(ctx, res);
  //       return ctx;
  //     });
  }

  onError(ctx) {
    return (err) => {
      console.log('does this ever get called')
      throw this.toError(err, ctx);
    };
  }

  toOptions() { }
  toResponse() { }
  makeRequest() { }
}

module.exports = Transport;
