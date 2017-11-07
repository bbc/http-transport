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

    it('sets the base query strings', () => {
      const request = Request.create();
      request.baseUrl(HOST + '?a=1&b=2');
      assert.equal(request._baseUrl, HOST);
      assert.deepEqual(request._queries, {
        a: 1,
        b: 2
      });
    });

    it('parses the query strings', () => {
      const request = Request.create();
      request.baseUrl(HOST + '?a=1&b=2&c=cem?whatevs');
      assert.equal(request._baseUrl, HOST);
      assert.deepEqual(request._queries, {
        a: 1,
        b: 2,
        c: 'cem?whatevs'
      });
    });

    it('parses multi-parameter queries', () => {
      const request = Request.create();
      request.baseUrl(HOST + '?a[0]=1&a[1]=2');
      assert.equal(request._baseUrl, HOST);
      assert.deepEqual(request._queries, {
        a: [1, 2]
      });
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

    it('query object takes precedence of url queries', () => {
      const request = Request.create();
      request
        .baseUrl(HOST + '?a=1&b=2')
        .addQuery('a', 10)
        .addQuery('b', 20);

      assert.equal(request.getUrl(), HOST + '?a=10&b=20');
    });

    it('uri-encodes query string parameters', () => {
      const request = Request.create();
      request
        .baseUrl(HOST + '?a=1&b=2')
        .addQuery('a', 10)
        .addQuery('b', '#?& !');

      assert.equal(request.getUrl(), HOST + '?a=10&b=%23%3F%26%20%21');
    });

    it('uri-encodes multi-parameter queries', () => {
      const request = Request.create();
      request.baseUrl(HOST).addQuery('a', [1, 2]);
      assert.equal(request.getUrl(), HOST + '?a%5B0%5D=1&a%5B1%5D=2');
    });
  });
});
