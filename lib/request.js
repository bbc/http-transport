'use strict';

const DEFAULT_TIMEOUT = 1000;

class Request {
  constructor() {
    this._queries = {};
    this._headers = {};
    this._timeout = undefined;
    this._method = undefined;
    this._url = undefined;
    this._body;
  }

  addQuery(k, v) {
    this._queries[k] = v;
    return this;
  }

  addHeader(k, v) {
    this._headers[k] = v;
    return this;
  }

  body(content) {
    this._body = content;
    return this;
  }

  method(method) {
    this._method = method;
    return this;
  }

  url(url) {
    this._url = url;
    return this;
  }

  timeout(timeout) {
    this._timeout = timeout;
    return this;
  }

  getMethod() {
    return this._method;
  }

  getTimeout() {
    return this._timeout || DEFAULT_TIMEOUT;
  }

  getUrl() {
    return this._url;
  }

  getHeaders() {
    return this._headers;
  }

  getQueries() {
    return this._queries;
  }

  hasQueries() {
    return Object.keys(this._queries).length > 0;
  }

  hasHeaders() {
    return Object.keys(this._headers).length > 0;
  }

  getBody() {
    return this._body;
  }

  static create() {
    return new Request();
  }
}

module.exports = Request;
