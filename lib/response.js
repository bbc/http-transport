'use strict';

const REQUIRED_PROPERTIES = [
  'body',
  'url',
  'statusCode',
  'statusText',
  'headers',
  'elapsedTime'
];

class Response {
  constructor() {
    this.headers = {};
    this.url;
    this.statusCode;
    this.statusText;
    this.elapsedTime;
    this.body;
    this.httpResponse;
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
      url: this.url,
      headers: this.headers,
      statusCode: this.statusCode,
      statusText: this.statusText,
      elapsedTime: this.elapsedTime
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
