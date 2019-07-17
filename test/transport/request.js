'use strict';

const assert = require('chai').assert;
const nock = require('nock');
const context = require('../../lib/context');
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();
const dns = require('dns');

const RequestTransport = require('../../lib/transport/request');

const url = 'http://www.example.com/';
const host = 'http://www.example.com';
const api = nock(host);
const path = '/';

const simpleResponseBody = 'Illegitimi non carborundum';
const requestBody = {
  foo: 'bar'
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
    api.get(path).reply(200, simpleResponseBody);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('.createRequest', () => {
    it('makes a GET request', () => {
      const ctx = createContext(url);
      const request = new RequestTransport();
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
        .reply(200, simpleResponseBody);

      const ctx = createContext(url);
      ctx.req.addHeader('test', 'qui curat');

      const request = new RequestTransport();
      return request
        .execute(ctx)
        .catch(assert.ifError)
        .then((ctx) => {
          assert.equal(ctx.res.statusCode, 200);
          assert.equal(ctx.res.body, simpleResponseBody);
        });
    });

    it('makes a GET request with query strings', () => {
      api.get('/?a=1').reply(200, simpleResponseBody);

      const ctx = createContext(url);
      ctx.req.addQuery('a', 1);

      const request = new RequestTransport();
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
      const request = new RequestTransport();

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
      const request = new RequestTransport();

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

      return new RequestTransport()
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

      return new RequestTransport()
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

      return new RequestTransport()
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

      return new RequestTransport()
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
        .socketDelay(500)
        .reply(200, simpleResponseBody);

      const ctx = createContext(url);
      ctx.req.timeout(20);

      return new RequestTransport()
        .execute(ctx)
        .then(() => {
          assert.fail('Expected request to timeout');
        })
        .catch((e) => {
          assert.ok(e);
          assert.equal(e.message, 'Request failed for get http://www.example.com/: ESOCKETTIMEDOUT');
        });
    });

    it('disables timing a request', () => {
      nock.cleanAll();
      api.get('/').reply(200, simpleResponseBody);

      const ctx = createContext(url);
      ctx.req.time = false;

      return new RequestTransport()
        .execute(ctx)
        .then((ctx) => {
          const timeTaken = ctx.res.elapsedTime;
          assert.isNotNumber(timeTaken);
        })
        .catch(assert.ifError);
    });

    it('enables timing request by default', () => {
      nock.cleanAll();
      api.get('/').reply(200, simpleResponseBody);

      const ctx = createContext(url);

      return new RequestTransport()
        .execute(ctx)
        .then((ctx) => {
          const timeTaken = ctx.res.elapsedTime;
          assert.isNumber(timeTaken);
        })
        .catch(assert.ifError);
    });

    it('override default request', () => {
      nock.cleanAll();
      api
        .get('/')
        .socketDelay(500)
        .reply(200, simpleResponseBody);

      const res = {
        body: simpleResponseBody,
        elapsedTime: 10,
        url: 'wheves',
        statusCode: 200,
        headers: []
      };

      const ctx = createContext(url);
      const customRequest = {
        getAsync: sandbox.stub().returns(Promise.resolve(res))
      };

      return new RequestTransport(customRequest)
        .execute(ctx)
        .then(() => {
          sinon.assert.calledOnce(customRequest.getAsync);
        })
        .catch(assert.ifError);
    });

    it('enables uses verbatim', () => {
      nock.cleanAll();
      api.get('/').reply(200, simpleResponseBody);

      sinon.spy(dns, 'lookup');

      const ctx = createContext(url);

      return new RequestTransport()
        .execute(ctx)
        .then((ctx) => {
          ctx.res.httpResponse.request.agentOptions.lookup('www.example.com', {}, () => {});
          sinon.assert.calledWith(dns.lookup, 'www.example.com', {verbatim: true});
        })
        .catch(assert.ifError);
    });

  });
});
