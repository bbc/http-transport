'use strict';

const Transport = require('./transport');
const https = require('node:https');
const http = require('node:http');
const HttpProxyAgent = require('http-proxy-agent').HttpProxyAgent;
const fetch = require('node-fetch');

const REQUIRED_PROPERTIES = [
  'elapsedTime',
  'url',
  'statusCode',
  'headers'
];

class FetchTransport extends Transport {
  constructor(options) {
    super();
    if (options?.agentOpts) {
      this._httpAgent = new http.Agent(options.agentOpts);
      this._httpsAgent = new https.Agent(options.agentOpts);
    }

    if (options?.defaults?.proxy) {
      this._httpProxyAgent = new HttpProxyAgent(options.defaults.proxy, options?.agentOpts);
    }

    this.defaults = options?.defaults;

    this._fetch = fetch;
  }

  toOptions(ctx) {
    const req = ctx.req;
    const opts = ctx.opts || {};

    opts.redirect = req.getRedirect() || this.defaults?.redirect;
    opts.timeout = req.getTimeout() || this.defaults?.timeout;
    opts.compress = this.defaults?.compress;
    if (this.defaults?.time === undefined) opts.time = true;

    if (req.hasQueries()) opts.searchParams = new URLSearchParams(req.getQueries());

    const body = ctx.req.getBody();
    if (body) {
      if (typeof body === 'object') {
        req.addHeader('Content-type', 'application/json');
        opts.body = JSON.stringify(body);
      } else {
        opts.body = body;
      }
    }

    if (this.jsonMode(ctx)) req.addHeader('Accept', 'application/json');

    if (req.hasHeaders()) opts.headers = req.getHeaders();

    return opts;
  }

  jsonMode(ctx) {
    if (ctx.opts?.json !== undefined) return ctx.opts.json;

    return this.defaults?.json;
  }

  async toResponse(ctx, from) {
    const to = ctx.res;
    REQUIRED_PROPERTIES.forEach((property) => {
      to[property] = from[property];
    });

    to.statusCode = from.status;
    to.headers = Object.fromEntries(from.headers.entries());

    // currently supports json and text formats only
    const text = await from.text();

    if (text) {
      to.body = text;
      const contentType = to.headers['content-type'];
      if (this.jsonMode(ctx, contentType) || contentType?.includes('json')) {
        try {
          to.body = JSON.parse(to.body);
        } catch {} // If body is not parseable, leave as text
      }
    }

    to.httpResponse = from;
    return to;
  }

  selectAgent(ctx) {
    if (this?.defaults?.proxy) return this._httpProxyAgent;

    const http = new URL(ctx.req.getUrl()).protocol === 'http:';
    return http ? this._httpAgent : this._httpsAgent;
  }

  async makeRequest(ctx, opts) {
    const controller = new AbortController();
    const method = ctx.req.getMethod();
    let fetchedResponse;

    opts = {
      ...opts,
      method,
      agent: this.selectAgent(ctx),
      signal: controller.signal
    };

    const timeout = opts.timeout && setTimeout(() => {
      controller.abort();
    }, opts.timeout);

    try {
      const start = process.hrtime.bigint();
      fetchedResponse = await this._fetch(ctx.req.getUrl(), opts);
      fetchedResponse.elapsedTime = opts.time ? Math.round(Number(process.hrtime.bigint() - start) / 1e6) : undefined; // nanoseconds to milliseconds
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('ESOCKETTIMEDOUT');
      } else {
        throw new Error(err.message);
      }
    } finally {
      clearTimeout(timeout);
    }

    return fetchedResponse;
  }
}

module.exports = FetchTransport;
