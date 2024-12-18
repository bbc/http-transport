'use strict';

const _ = require('lodash');

const HttpTransportClient = require('./client');

function validatePlugin(plugin) {
  if (typeof plugin !== 'function') throw new TypeError('Plugin is not a function');
}

/** @class */
class HttpTransportBuilder {
  /**
   * Configures HttpTransport client
   * @param {Transport} transport - Transport instance.
   */
  constructor(transport) {
    this._transport = transport;
    this._defaults = {
      plugins: []
    };
  }

  /**
   * Sets a default user agent
   *
   * @param {string} agent - user agent
   * @return a HttpTransportBuilder instance
   * @example
   * const httpTransport = require('@bbc/http-transport');
   *
   * const builder = httpTransport.createBuilder();
   * builder.userAgent('some-user-agent');
   */
  userAgent(userAgent) {
    _.set(this._defaults, 'ctx.userAgent', userAgent);
    return this;
  }

  /**
   * Set the default number of retries
   *
   * @param {integer} retries - number of retry attempts
   * @return a HttpTransportBuilder instance
   * @example
   * const httpTransport = require('@bbc/http-transport');
   *
   * const builder = httpTransport.createBuilder();
   * builder.retries(5);
   */
  retries(retries) {
    _.set(this._defaults, 'ctx.retries', retries);
    return this;
  }

  /**
   * default time delay between retries
   *
   * @param {integer} delay - delay time in ms
   * @return a HttpTransportBuilder instance
   * @example
   * const httpTransport = require('@bbc/http-transport');
   *
   * const builder = httpTransport.createBuilder();
   * builder.retryDelay(1000);
   */
  retryDelay(delay) {
    _.set(this._defaults, 'ctx.retryDelay', delay);
    return this;
  }

  /**
   * default the criticalErrorDetector which parses errors and decides if they are critical. This mainly enables retry logic.
   * @param {function} criticalErrorDetector (err, ctx) => bool - a function that takes the error and the context and returns a boolean which evaluates whether an error is a critical error.
   * This is useful if you want to customise error behaviour. See below for example that prevents circuitBreaker errors from being classed as critical errors.
   * criticalErrors trigger retry behaviour and so may not be desirable in all scenarios.
   * @return a HttpTransportBuilder instance
   * @example
   * const httpTransport = require('@bbc/http-transport');
   *
   * const builder = httpTransport.createBuilder();
   * builder.criticalErrorDetector(() => {
   *  if (err && (err.statusCode < 500 || err.isBrokenCircuitError)) {
   *    return false;
   *  }
   *  return true;
   * });
   *
   * @default
   * (err, ctx) => {
   *   if (err && err.statusCode < 500) {
   *     return false;
   *   }
   *   return true;
   * }
   */
  criticalErrorDetector(criticalErrorDetector) {
    _.set(this._defaults, 'ctx.criticalErrorDetector', criticalErrorDetector);
    return this;
  }

  /**
   * Registers a global plugin, which is used for all requests
   *
   * @param {function} fn - a global plugin
   * @return a HttpTransportBuilder instance
   * @example
   * const toError = require('@bbc/http-transport-errors');
   * const httpTransport = require('@bbc/http-transport');
   *
   * const client = httpTransport.createClient();
   * client.useGlobal(toError(404));
   */
  use(fn) {
    validatePlugin(fn);
    this._defaults.plugins.push(fn);
    return this;
  }

  /**
   * Instantiates a HttpTransport
   *
   * @return a HttpTransport instance
   * @example
   *
   * const client = httpTransport.createClient();
   */
  createClient() {
    return new HttpTransportClient(this._transport, this._defaults);
  }
}

module.exports = HttpTransportBuilder;
