'use strict';

const _ = require('lodash');

const CallbackDecorator = require('./callbacks/decorator');
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
    this._callback = false;
    this._transport = transport;
    this._defaults = {
      plugins: []
    };
  }

  /**
   * Sets a default user agent
   *
   * @param {string} agent - user agant
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
   * Callbackify the client
   *
   * @return a HttpTransport instance supporting callbacks
   * @example
   *
   * const client = httpTransport.asCallback().createClient();
   */
  asCallback() {
    this._callback = true;
    return this;
  }

  /**
   * Instantiates a HttpTransport
   *
   * @param {function} fn - a global plugin
   * @return a HttpTransport instance
   * @example
   *
   * const client = httpTransport.createClient();
   */
  createClient() {
    const transportClient = new HttpTransportClient(this._transport, this._defaults);
    if (this._callback) {
      return new CallbackDecorator(transportClient);
    }
    return transportClient;
  }
}

module.exports = HttpTransportBuilder;
