'use strict';

const _ = require('lodash');

const REQUIRED_PROPERTIES = [
  'url',
  'body',
  'statusCode',
  'headers',
  'elapsedTime'
];

class Response {
  constructor() {
    this.headers = {};
    this.elapsedTime = 0;
    this.url;
    this.statusCode;
    this.body;
  }

  getHeader(header) {
    return this.headers[header];
  }

  addHeader(name, value) {
    if (typeof name === 'object') {
      for (const k in name) {
        this.addHeader(k, name[k]);
      }
    } else {
      this.headers[name] = value;
    }
    return this;
  }

  get length() {
    const length = this.getHeader('Content-Length');
    if (length) return length;

    if (typeof this.body === 'string') {
      return this.body.length;
    }
    return JSON.stringify(this.body).length;
  }

  toJSON() {
    return {
      body: this.body,
      elapsedTime: this.elapsedTime,
      url: this.url,
      headers: this.headers,
      statusCode: this.statusCode
    };
  }

  static create(opts) {
    const res = new Response();
    if (opts) {
      REQUIRED_PROPERTIES.forEach((property) => {
        res[property] = opts[property];
      });
    }
    return res;
  }
}

module.exports = Response;
