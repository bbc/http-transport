'use strict';

const assert = require('assert');
const Request = require('../lib/request');

const HOST = 'https://example.com';

describe('Request', () => {
  describe('.baseUrl', () => {
    it('sets the base URL', () => {
      const request = Request.create();
      request.baseUrl(HOST);
      assert.equal(request._baseUrl, HOST);
    });

    it('sets the base with queries', () => {
      const request = Request.create();
      request.baseUrl(HOST + '?a=1&n=2');
      assert.equal(request._baseUrl, HOST + '?a=1&n=2');
    });
  });

  describe('.getUrl', () => {
    it('returns an url', () => {
      const request = Request.create();
      request.baseUrl(HOST);

      assert.equal(request.getUrl(), HOST);
    });

    it('returns an url including query strings', () => {
      const request = Request.create();
      request
        .baseUrl(HOST)
        .addQuery('a', 1)
        .addQuery('b', 2);

      assert.equal(request.getUrl(), HOST + '?a=1&b=2');
    });

    it('query object gets appended to url queries', () => {
      const request = Request.create();
      request
        .baseUrl(HOST + '?a=1&b=2')
        .addQuery('a', 10)
        .addQuery('b', 20);

      assert.equal(request.getUrl(), HOST + '?a=1&b=2&a=10&b=20');
    });

    it('supports multiple queries', () => {
      const request = Request.create();
      request.baseUrl(HOST + '?a=1&a=2').addQuery('a', 3);

      assert.equal(request.getUrl(), HOST + '?a=1&a=2&a=3');
    });

    it('uri-encodes query string parameters', () => {
      const request = Request.create();
      request
        .baseUrl(HOST)
        .addQuery('a', 10)
        .addQuery('b', '#?& !');

      assert.equal(request.getUrl(), HOST + '?a=10&b=%23%3F%26%20%21');
    });

    it('adds multi-parameter queries correctly', () => {
      const request = Request.create();
      request.baseUrl(HOST).addQuery('a', [1, 2]);
      assert.equal(request.getUrl(), HOST + '?a=1&a=2');
    });
  });

  describe('.getRequestKey', () => {
    it('returns a cacheable key for a request', () => {
      const request = Request.create();

      request
        .method('GET')
        .baseUrl(HOST)
        .addQuery('a', 1)
        .addQuery('b', 2);

      const key = `GET:${HOST}?a=1&b=2`;
      assert.equal(request.getRequestKey(), key);
    });
  });
});
