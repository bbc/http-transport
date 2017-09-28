'use strict';

const _ = require('lodash');
const Request = require('./request');
const Response = require('./response');

const RETRIES = 0;
const RETRY_DELAY = 100;

class Context {
  constructor(defaults) {
    this.plugins = [];
    this.req = Request.create();
    this.res = Response.create();
    if (defaults) this._applyDefaults(defaults);
  }

  addPlugin(plugin) {
    this.plugins.push(plugin);
    return this;
  }

  _applyDefaults(defaults) {
    this.retries = _.get(defaults, 'ctx.retries', RETRIES);
    this.retryDelay = _.get(defaults, 'ctx.retryDelay', RETRY_DELAY);
  }

  static create(defaults) {
    return new Context(defaults);
  }
}

module.exports = Context;
