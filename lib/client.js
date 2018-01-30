'use strict';

const _ = require('lodash');
const compose = require('koa-compose');
const context = require('./context');
const rejectedPromise = require('./rejectedPromise');
const bind = require('./bind');

/** @class */
class HttpTransport {
  constructor(httpTransport, defaults) {
    this._httpTransport = httpTransport;
    this._instancePlugins = _.get(defaults, 'plugins', []);
    this._defaults = defaults;
    this._initContext();
    bind(this);
  }

  /**
   * Registers a per request plugin
   *
   * @method use
   * @return a HttpTransport instance
   * @param {function} fn - per request plugin
   * @example
   * const toError = require('http-transport-errors');
   * const httpTransport = require('http-transport');
   *
   * httpTransport.createClient()
   *    .use(toError(404));
   */
  use(plugin) {
    validatePlugin(plugin);
    this._ctx.addPlugin(plugin);
    return this;
  }

  /**
   * Make a HTTP GET request
   *
   * @method get
   * @param {string} url
   * @return a HttpTransport instance
   * @example
   * const httpTransport = require('http-transport');
   *
   * const response = httpTransport.createClient()
   *    .get(url)
   *    .asResponse();
   */
  get(baseUrl) {
    this._ctx.req.method('GET').baseUrl(baseUrl);
    return this;
  }

  /**
   * Make a HTTP POST request
   *
   * @method post
   * @param {string} url
   * @param {object} request body
   * @return a HttpTransport instance
   * @example
   * const httpTransport = require('http-transport');
   *
   * const response = httpTransport.createClient()
   *    .post(url, requestBody)
   *    .asResponse();
   */
  post(url, body) {
    this._ctx.req
      .method('POST')
      .body(body)
      .baseUrl(url);
    return this;
  }

  /**
   * Make a HTTP PUT request
   *
   * @method put
   * @param {string} url
   * @param {object} request body
   * @return a HttpTransport instance
   * @example
   * const httpTransport = require('http-transport');
   *
   * const response = httpTransport.createClient()
   *    .put(url, requestBody)
   *    .asResponse();
   */
  put(url, body) {
    this._ctx.req
      .method('PUT')
      .body(body)
      .baseUrl(url);
    return this;
  }

  /**
   * Make a HTTP DELETE request
   *
   * @method delete
   * @param {string} url
   * @param {object} request body
   * @return a HttpTransport instance
   * @example
   * const httpTransport = require('http-transport');
   *
   * const response = httpTransport.createClient()
   *    .delete(url)
   *    .asResponse();
   */
  delete(url) {
    this._ctx.req.method('DELETE').baseUrl(url);
    return this;
  }

  /**
   * Make a HTTP PATCH request
   *
   * @method patch
   * @param {string} url
   * @param {object} request body
   * @return a HttpTransport instance
   * @example
   * const httpTransport = require('http-transport');
   *
   * const response = httpTransport.createClient()
   *    .put(url, requestBody)
   *    .asResponse();
   */
  patch(url, body) {
    this._ctx.req
      .method('PATCH')
      .body(body)
      .baseUrl(url);
    return this;
  }

  /**
   * Make a HTTP HEAD request
   *
   * @method head
   * @param {string} url
   * @return a HttpTransport instance
   * @example
   * const httpTransport = require('http-transport');
   *
   * const response = httpTransport.createClient()
   *    .head(url)
   *    .asResponse();
   */
  head(url) {
    this._ctx.req.method('HEAD').baseUrl(url);
    return this;
  }

  /**
   * Sets the request headers
   *
   * @method headers
   * @param {string|object} name - header name or headers object
   * @param {string|object} value - header value
   * @return a HttpTransport instance
   * @example
   * const httpTransport = require('http-transport');
   *
   * const response = httpTransport.createClient()
   *    .headers({
   *      'User-Agent' : 'someUserAgent'
   *    })
   *    .asResponse();
   */
  headers() {
    const args = normalise(arguments);
    Object.keys(args).forEach((key) => {
      this._ctx.req.addHeader(key, args[key]);
    });
    return this;
  }

  /**
   * Sets the query strings
   *
   * @method query
   * @param {string|object} name - query name or query object
   * @param {string|object} value - query value
   * @return a HttpTransport instance
   * @example
   * const httpTransport = require('http-transport');
   *
   * const response = httpTransport.createClient()
   *    .query({
   *      'perPage' : 1
   *    })
   *    .asResponse();
   */
  query() {
    const args = normalise(arguments);
    Object.keys(args).forEach((key) => {
      this._ctx.req.addQuery(key, args[key]);
    });
    return this;
  }

  /**
   * Sets a request timeout
   *
   * @method timeout
   * @param {integer} timeout - timeout in seconds
   * @return a HttpTransport instance
   * @example
   * const httpTransport = require('http-transport');
   *
   * const response = httpTransport.createClient()
   *    .timeout(1)
   *    .asResponse();
   */
  timeout(secs) {
    this._ctx.req.timeout(secs);
    return this;
  }

  /**
   * Set the number of retries on failure for the request
   *
   * @method retry
   * @param {integer} timeout - number of times to retry a failed request
   * @return a HttpTransport instance
   * @example
   * const httpTransport = require('http-transport');
   *
   * const response = httpTransport.createClient()
   *    .retry(5) // for this request only
   *    .asResponse();
   */
  retry(retries) {
    this._ctx.retries = retries;
    return this;
  }

  /**
   * Set the delay between retries in ms
   *
   * @method retryDelay
   * @param {integer} timeout - number of ms to wait between retries (default: 100)
   * @return a HttpTransport instance
   * @example
   * const httpTransport = require('http-transport');
   *
   * const response = httpTransport.createClient()
   *    .retry(2)
   *    .retryDelay(200)
   *    .asResponse();
   */
  retryDelay(ms) {
    this._ctx.retryDelay = ms;
    return this;
  }

  /**
   * Initiates the request, returning the response body, if successful.
   *
   * @method asBody
   * @return a Promise. If the Promise fulfils,
   * the fulfilment value is the response body, as a string by default.
   * @example
   * const httpTransport = require('http-transport');
   *
   * const response = httpTransport.createClient()
   *    .asBody()
   *    .then((body) => {
   *      console.log(body);
   *    });
   */
  async asBody() {
    const res = await this.asResponse();
    return res.body;
  }

  /**
   * Initiates the request, returning a http transport response object, if successful.
   *
   * @method asResponse
   * @return a Promise. If the Promise fulfils,
   * the fulfilment value is response object.
   * @example
   * const httpTransport = require('http-transport');
   *
   * const response = httpTransport.createClient()
   *    .asResponse()
   *    .then((body) => {
   *      console.log(body);
   *    });
   */
  async asResponse() {
    const currentContext = this._ctx;
    this._initContext();

    const ctx = await retry(this._executeRequest, currentContext);
    return ctx.res;
  }

  _getPlugins(ctx) {
    return this._instancePlugins.concat(ctx.plugins);
  }

  _applyPlugins(ctx, next) {
    const fn = compose(this._getPlugins(ctx));
    return fn(ctx, next);
  }

  async _executeRequest(ctx) {
    await this._applyPlugins(ctx, this._handleRequest);
    return ctx;
  }

  async _handleRequest(ctx, next) {
    await this._httpTransport.execute(ctx);
    return next();
  }

  _initContext() {
    this._ctx = context.create(this._defaults);
    this.headers('User-Agent', this._ctx.userAgent);
  }
}

function isCriticalError(err) {
  if (err && err.statusCode < 500) {
    return false;
  }
  return true;
}

function toRetry(err) {
  return {
    reason: err.message,
    statusCode: err.statusCode
  };
}

function retry(fn, ctx) {
  ctx.res.retries = [];
  ctx.res.maxAttempts = ctx.retries;
  const request = fn.bind(this, ctx);

  function attempt(i) {
    return request()
      .catch((err) => {
        if (ctx.retries > 0) {
          const delayBy = rejectedPromise(ctx.retryDelay);
          return delayBy(err);
        }
        throw err;
      })
      .catch((err) => {
        if (i < ctx.retries && isCriticalError(err)) {
          ctx.res.retries.push(toRetry(err));
          return attempt(++i);
        }
        throw err;
      });
  }
  return attempt(0);
}

function toObject(arr) {
  const obj = {};
  for (let i = 0; i < arr.length; i += 2) {
    obj[arr[i]] = arr[i + 1];
  }
  return obj;
}

function isObject(value) {
  return value !== null && typeof value === 'object';
}

function normalise(args) {
  args = Array.from(args);
  if (isObject(args[0])) {
    return args[0];
  }
  return toObject(args);
}

function validatePlugin(plugin) {
  if (typeof plugin !== 'function') throw new TypeError('Plugin is not a function');
}

module.exports = HttpTransport;
