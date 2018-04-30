'use strict';

const _ = require('lodash');
const promisifyAll = require('./promiseUtils').promisifyAll;
const Transport = require('./transport');
const Request = require('request');

const REQUIRED_PROPERTIES = [
  'body',
  'elapsedTime',
  'url',
  'statusCode',
  'headers'
];

function toAsyncMethod(method) {
  return `${method.toLowerCase()}Async`;
}

class RequestTransport extends Transport {
  constructor(customRequest) {
    super();
    this._request = promisifyAll(customRequest || Request);
  }

  toOptions(ctx) {
    const req = ctx.req;

    const opts = Object.assign({
      time: true
    }, ctx.opts);

    if (req.getTimeout() !== undefined) {
      opts.timeout = req.getTimeout();
    }

    if (!_.isUndefined(req.time)) opts.time = req.time;
    if (req.hasQueries()) opts.qs = req.getQueries();
    if (req.hasHeaders()) opts.headers = req.getHeaders();
    const body = ctx.req.getBody();
    if (body) {
      if (typeof body === 'object') opts.json = true;
      opts.body = body;
    }
    return opts;
  }

  toResponse(ctx, from) {
    const to = ctx.res;
    REQUIRED_PROPERTIES.forEach((property) => {
      to[property] = from[property];
    });

    to.httpResponse = from;
    return to;
  }

  makeRequest(ctx, opts) {
    const url = ctx.req.getUrl();
    const method = ctx.req.getMethod();

    return this._request[toAsyncMethod(method)](url, opts);
  }
}

module.exports = RequestTransport;
