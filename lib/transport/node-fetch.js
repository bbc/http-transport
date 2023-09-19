'use strict';

const Transport = require('./transport');
const https = require('node:https');
const http = require('node:http');
// eslint-disable-next-line func-style
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const REQUIRED_PROPERTIES = [
  'body',
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

    this.defaults = options?.defaults;

    this._fetch = fetch;
  }

  toOptions(ctx) {
    const req = ctx.req;
    const opts = ctx.opts || {};

    opts.timeout = req.getTimeout() || this.defaults?.timeout;
    opts.compress = this.defaults?.compress;
    if (opts.time === undefined) opts.time = true;

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

    if (req.hasHeaders()) opts.headers = req.getHeaders();

    return opts;
  }

  async toResponse(ctx, from) {
    const to = ctx.res;
    REQUIRED_PROPERTIES.forEach((property) => {
      to[property] = from[property];
    });

    to.statusCode = from.status;
    to.headers = Object.fromEntries(from.headers.entries());

    // currently supports json and text formats only
    const contentType = to.headers['content-type'];
    if (contentType?.includes('json')) {
      to.body = await from.json();
    } else if (contentType?.includes('text')) {
      to.body = await from.text();
    }

    to.httpResponse = from;
    return to;
  }

  async makeRequest(ctx, opts) {
    const controller = new AbortController();
    const method = ctx.req.getMethod();
    let fetchedResponse;

    opts = {
      ...opts,
      method,
      agent: new URL(ctx.req.getUrl()).protocol === 'http:' ? this._httpAgent : this._httpsAgent,
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
