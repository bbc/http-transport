'use strict';

const _ = require('lodash');
const Transport = require('./transport');
const dns = require('dns');
const https = require('node:https');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const REQUIRED_PROPERTIES = [
  'body',
  'url',
  'status',
  'statusText',
  'headers'
];

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
    if (req.hasQueries()) opts.searchParams = new URLSearchParams(req.getQueries());

    const body = ctx.req.getBody();
    if (body) {
      if (typeof body === 'object') {
        req.addHeader('Content-type','application/json');
      } 
      opts.body = body;
    }
    if (req.hasHeaders()) opts.headers = req.getHeaders();

    return opts;
  }

  async toResponse(ctx, from) {
    const to = ctx.res;
    console.log('from', from)
    const contentType = from.headers?.get('content-type');
    REQUIRED_PROPERTIES.forEach((property) => {
      to[property] = from[property];
    });

    // currently supports json and text formats only
    if (contentType?.includes("json")) {
      to.body = await from.json();
    }
    else if (contentType?.includes("text")) {
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
      agent: this._agent,
      signal: controller.signal
    };

    const url = ctx.req.getUrl();
    if ( opts.searchParams ) url += opts.searchParams;

    const timeout = setTimeout(() => { controller.abort(); }, opts.timeout);

    try {
      fetchedResponse = await this._fetch(url, opts);
    } catch (err) {

      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Operation was aborted.');
      }
      else {
        throw new Error(err.message);
      }
    } finally {
      clearTimeout(timeout);
    }

    return fetchedResponse;
  }
}

module.exports = RequestTransport;
