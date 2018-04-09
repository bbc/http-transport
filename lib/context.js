'use strict';

const _ = require('lodash');

const Request = require('./request');
const Response = require('./response');
const packageInfo = require('../package');

const RETRIES = 0;
const RETRY_DELAY = 100;
const USER_AGENT = `${packageInfo.name}/${packageInfo.version}`;

class Context {
  constructor(defaults) {
    this.retries = 0;
    this._retryAttempts = [];
    this.plugins = [];
    this.req = Request.create();
    this.res = Response.create();
    if (defaults) this._applyDefaults(defaults);
  }

  get retryAttempts() {
    if (_.isUndefined(this._retryAttempts)) return [];
    return this._retryAttempts;
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
    this.userAgent = _.get(defaults, 'ctx.userAgent', USER_AGENT);
    this.retries = _.get(defaults, 'ctx.retries', RETRIES);
    this.retryDelay = _.get(defaults, 'ctx.retryDelay', RETRY_DELAY);
  }

  static create(defaults) {
    return new Context(defaults);
  }
}

module.exports = Context;
