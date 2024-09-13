'use strict';

const Request = require('./request');
const Response = require('./response');
const packageInfo = require('../package');

const RETRIES = 0;
const RETRY_DELAY = 100;
const USER_AGENT = `${packageInfo.name}/${packageInfo.version}`;

class Context {
  constructor(defaults) {
    /**
     * Retries only work on critical HTTP 5XX errors
     */
    this.retries = 0;
    this.redirect = undefined;
    this._retryAttempts = [];
    this.plugins = [];
    this.req = Request.create();
    this.res = Response.create();
    if (defaults) this._applyDefaults(defaults);
  }

  get retryAttempts() {
    return this._retryAttempts || [];
  }

  set retryAttempts(retryAttempts) {
    if (!Array.isArray(retryAttempts)) {
      retryAttempts = [];
    }
    this._retryAttempts = retryAttempts;
  }

  addPlugin(plugin) {
    this.plugins.push(plugin);
    return this;
  }

  _applyDefaults(defaults) {
    this.userAgent = defaults.ctx?.userAgent || USER_AGENT;
    this.retries = defaults.ctx?.retries || RETRIES;
    this.retryDelay = defaults.ctx?.retryDelay || RETRY_DELAY;
  }

  static create(defaults) {
    return new Context(defaults);
  }
}

module.exports = Context;
