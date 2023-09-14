'use strict';

const assert = require('chai').assert;
const nock = require('nock');
const nodeFetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const context = require('../../lib/context');
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();

const FetchTransport = require('../../lib/transport/node-fetch');

const url = 'http://www.example.com/';
const httpsUrl = 'https://www.example.com/';
const host = 'http://www.example.com';
const httpsHost = 'https://www.example.com';
const api = nock(host);
const httpsApi = nock(httpsHost);
const path = '/';

const simpleResponseBody = 'Illegitimi non carborundum';
const requestBody = {
  foo: 'bar'
};
const header = {
  'Content-Type': 'text/html'
};
const responseBody = requestBody;

function createContext(url, method) {
  method = method || 'get';

  const ctx = context.create();
  ctx.req.method(method).baseUrl(url);
  return ctx;
}

describe('Request HTTP transport', () => {
  beforeEach(() => {
    nock.disableNetConnect();
    nock.cleanAll();
    api.get(path).reply(200, simpleResponseBody, header);
    httpsApi.get(path).reply(200, simpleResponseBody, header);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('.createRequest', () => {
    it('makes a GET request', () => {
      const ctx = createContext(url);
      const request = new FetchTransport();
      return request
        .execute(ctx)
        .catch(assert.ifError)
        .then((ctx) => {
          assert.equal(ctx.res.statusCode, 200);
          assert.equal(ctx.res.body, simpleResponseBody);
        });
    });

    it('makes a GET request with headers', () => {
      nock.cleanAll();
      nock(host, {
        reqheaders: {
          test: 'qui curat'
        }
      })
        .get(path)
        .reply(200, simpleResponseBody, header);

      const ctx = createContext(url);
      ctx.req.addHeader('test', 'qui curat');

      const request = new FetchTransport();
      return request
        .execute(ctx)
        .catch(assert.ifError)
        .then((ctx) => {
          assert.equal(ctx.res.statusCode, 200);
          assert.equal(ctx.res.body, simpleResponseBody);
        });
    });

    it('makes a GET request with query strings', () => {
      api.get('/?a=1').reply(200, simpleResponseBody, header);

      const ctx = createContext(url);
      ctx.req.addQuery('a', 1);

      const request = new FetchTransport();
      return request
        .execute(ctx)
        .catch(assert.ifError)
        .then((ctx) => {
          assert.equal(ctx.res.statusCode, 200);
          assert.equal(ctx.res.body, simpleResponseBody);
        });
    });

    it('does not allow adding an empty query string', () => {
      const ctx = createContext(url);
      ctx.req.addQuery();
      const request = new FetchTransport();

      return request
        .execute(ctx)
        .catch(assert.ifError)
        .then((ctx) => {
          const keys = Object.keys(ctx.req.getQueries()).length;
          assert.equal(keys, 0);
        });
    });

    it('does not allow adding an empty header', () => {
      const ctx = createContext(url);
      ctx.req.addHeader();
      const request = new FetchTransport();

      return request
        .execute(ctx)
        .catch(assert.ifError)
        .then((ctx) => {
          const keys = Object.keys(ctx.req.getHeaders()).length;
          assert.equal(keys, 0);
        });
    });

    it('makes a PUT request with a JSON body', () => {
      api.put(path, requestBody).reply(201, responseBody);
      const ctx = createContext(url, 'put');
      ctx.req.body(requestBody);

      return new FetchTransport()
        .execute(ctx)
        .catch(assert.ifError)
        .then((ctx) => {
          assert.equal(ctx.res.statusCode, 201);
          assert.deepEqual(ctx.res.body, responseBody);
        });
    });

    it('makes a POST request with a JSON body', () => {
      api.post(path, requestBody).reply(201, responseBody);
      const ctx = createContext(url, 'post');
      ctx.req.body(requestBody);

      return new FetchTransport()
        .execute(ctx)
        .catch(assert.ifError)
        .then((ctx) => {
          assert.equal(ctx.res.statusCode, 201);
          assert.deepEqual(ctx.res.body, responseBody);
        });
    });

    it('makes a DELETE request with a JSON body', () => {
      api.delete(path).reply(204);
      const ctx = createContext(url, 'delete');
      ctx.req.body(requestBody);

      return new FetchTransport()
        .execute(ctx)
        .catch(assert.ifError)
        .then((ctx) => {
          assert.equal(ctx.res.statusCode, 204);
        });
    });

    it('makes a PATCH request with a JSON body', () => {
      api.patch(path).reply(204);
      const ctx = createContext(url, 'patch');
      ctx.req.body(requestBody);

      return new FetchTransport()
        .execute(ctx)
        .catch(assert.ifError)
        .then((ctx) => {
          assert.equal(ctx.res.statusCode, 204);
        });
    });

    it('sets a timeout', () => {
      nock.cleanAll();
      api
        .get('/')
        .delay(500)
        .reply(200, simpleResponseBody);

      const ctx = createContext(url);
      ctx.req.timeout(20);

      return new FetchTransport()
        .execute(ctx)
        .then(() => {
          assert.fail('Expected request to timeout');
        })
        .catch((e) => {
          assert.ok(e);
          assert.equal(e.message, 'Request failed for get http://www.example.com/: ESOCKETTIMEDOUT');
        });
    });

    it('sets a default timeout', () => {
      nock.cleanAll();
      api
        .get('/')
        .delay(500)
        .reply(200, simpleResponseBody);

      const ctx = createContext(url);

      return new FetchTransport({
        defaults: {
          timeout: 50
        }
      })
        .execute(ctx)
        .then(() => {
          assert.fail('Expected request to timeout');
        })
        .catch((e) => {
          assert.ok(e);
          assert.equal(e.message, 'Request failed for get http://www.example.com/: ESOCKETTIMEDOUT');
        });
    });

    it('enables timing request by default', () => {
      nock.cleanAll();
      api.get('/').reply(200, simpleResponseBody);

      const ctx = createContext(url);

      return new FetchTransport()
        .execute(ctx)
        .then((ctx) => {
          const timeTaken = ctx.res.elapsedTime;
          assert.isNumber(timeTaken);
        })
        .catch(assert.ifError);
    });

    it.only('selects httpsAgent when protocol is https and agent options have been provided', () => {
      sandbox.stub(nodeFetch).returns({});
      
      const ctx = createContext(httpsUrl);
      const options = {
        agentOpts: {
          keepAlive: true,
          maxSockets: 1000
        }
      }
      const fetch = new FetchTransport(options);
      const reqOpts = {
        timeout: undefined,
        compress: undefined,
        method: 'get',
        agent: undefined
      }
      
      return fetch
        .execute(ctx)
        .catch(assert.ifError)
        .then((ctx) => {
          sinon.assert.calledWith(fetch._fetch, reqOpts);
        });
    });
  });
});
