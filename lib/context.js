'use strict';

const Request = require('./request');
const Response = require('./response');

class Context {
  constructor() {
    this.plugins = [];
    this.req = Request.create();
    this.res = Response.create();
  }

  addPlugin(plugin) {
    this.plugins.push(plugin);
    return this;
  }

  static create() {
    return new Context();
  }
}

module.exports = Context;
