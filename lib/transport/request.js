'use strict';

const _ = require('lodash');
// const promisifyAll = require('./promiseUtils').promisifyAll;
const Transport = require('./transport');
const Request = require('request-promise-native');
const dns = require('dns');
const https = require('node:https');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const REQUIRED_PROPERTIES = [
  'body',
  'elapsedTime',
  'url',
  'statusCode',
  'headers'
];

// function toAsyncMethod(method) {
//   return `${method.toLowerCase()}Async`;
// }

class RequestTransport extends Transport {
  constructor(defaultOptions) {
    super();
    if (defaultOptions) {
      this._agent = new https.Agent(defaultOptions.certOpts);
    }
    this._fetch = fetch;
  }

  toOptions(ctx) {
    const req = ctx.req;
    const opts = Object.assign({
      time: true,
      agentOptions: {
        lookup: function(domain, options, cb) {
          // Prevent Node from reordering A and AAAA records.
          // See https://nodejs.org/api/dns.html#dns_dns_lookup_hostname_options_callback
          options.verbatim = true;
          return dns.lookup(domain, options, cb);
        }
      }
    }, ctx.opts);

    if (req.getTimeout() !== undefined) {
      opts.timeout = req.getTimeout();
    }

    if (!_.isUndefined(req.time)) opts.time = req.time;
    // if (req.hasQueries()) opts.qs = req.getQueries();
    if (req.hasQueries()) opts.searchParams = new URLSearchParams(req.getQueries());

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
    console.log({from})
    REQUIRED_PROPERTIES.forEach((property) => {
      to[property] = from[property];
    });

    to.httpResponse = from;
    return to;
  }

  makeRequest(ctx, opts) {
    opts = {
      ...opts,
      agent: this._agent
    };
    const url = ctx.req.getUrl();
    if( opts.searchParams ) url += opts.searchParams;
    const method = ctx.req.getMethod();
    return this._fetch(url, opts); // these options were originally passed to the request module, we need to translate it to node-fetch options
  }
}

module.exports = RequestTransport;
