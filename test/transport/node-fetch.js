'use strict';

const assert = require('chai').assert;
const nock = require('nock');
const context = require('../../lib/context');
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();

const FetchTransport = require('../../lib/transport/node-fetch');
// const setContextProperty

const url = 'http://www.example.com/';
const httpsUrl = 'https://www.example.com/';
const proxyUrl = 'http://forward-proxy.ibl.test.api.bbci.co.uk';
const host = 'http://www.example.com';
const httpsHost = 'https://www.example.com';

const api = nock(host);
const httpsApi = nock(httpsHost);
const path = '/';

const responseBody = 'Illegitimi non carborundum';
const JSONResponseBody = { body: 'Illegitimi non carborundum' };
const requestBody = {
  foo: 'bar'
};
const header = {
  'Content-Type': 'text/html'
};
const jsonHeader = {
  'Content-Type': 'application/json'
};
const postResponseBody = requestBody;

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
    api.get(path).reply(200, responseBody, header);
    httpsApi.get(path).reply(200, responseBody, header);
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
          assert.equal(ctx.res.body, responseBody);
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
        .reply(200, responseBody, header);

      const ctx = createContext(url);
      ctx.req.addHeader('test', 'qui curat');

      const request = new FetchTransport();
      return request
        .execute(ctx)
        .catch(assert.ifError)
        .then((ctx) => {
          assert.equal(ctx.res.statusCode, 200);
          assert.equal(ctx.res.body, responseBody);
        });
    });

    it('makes a GET request with query strings', () => {
      api.get('/?a=1').reply(200, responseBody, header);

      const ctx = createContext(url);
      ctx.req.addQuery('a', 1);

      const request = new FetchTransport();
      return request
        .execute(ctx)
        .catch(assert.ifError)
        .then((ctx) => {
          assert.equal(ctx.res.statusCode, 200);
          assert.equal(ctx.res.body, responseBody);
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

    it('makes a POST request with a JSON body', () => {
      api.post(path, requestBody).reply(201, postResponseBody);
      const ctx = createContext(url, 'post');
      ctx.req.body(requestBody);

      return new FetchTransport()
        .execute(ctx)
        .catch(assert.ifError)
        .then((ctx) => {
          assert.equal(ctx.res.statusCode, 201);
          assert.deepEqual(ctx.res.body, postResponseBody);
        });
    });

    it('makes a PUT request with a JSON body', () => {
      api.put(path, requestBody).reply(201, postResponseBody);
      const ctx = createContext(url, 'put');
      ctx.req.body(requestBody);

      return new FetchTransport()
        .execute(ctx)
        .catch(assert.ifError)
        .then((ctx) => {
          assert.equal(ctx.res.statusCode, 201);
          assert.deepEqual(ctx.res.body, postResponseBody);
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
        .reply(200, responseBody);

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
        .reply(200, responseBody);

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
      api.get('/').reply(200, responseBody);

      const ctx = createContext(url);

      return new FetchTransport()
        .execute(ctx)
        .then((ctx) => {
          const timeTaken = ctx.res.elapsedTime;
          assert.isNumber(timeTaken);
        })
        .catch(assert.ifError);
    });

    describe('JSON parsing', () => {
      it('if json default option is passed in as true, parse body as json', () => {
        nock.cleanAll();
        api.get(path).reply(200, JSONResponseBody);

        const ctx = createContext(url);
        const options = {
          defaults: {
            json: true
          }
        };

        const fetchTransport = new FetchTransport(options);

        return fetchTransport
          .execute(ctx)
          .catch(assert.ifError)
          .then(() => {
            assert.typeOf(ctx.res.body, 'object', 'we have an object');
          });
      });

      it('if there is no json default option passed in, but the content type header includes application/json, then parse body as json', () => {
        nock.cleanAll();
        api.get(path).reply(200, JSONResponseBody, jsonHeader);

        const ctx = createContext(url);
        const fetchTransport = new FetchTransport();

        return fetchTransport
          .execute(ctx)
          .catch(assert.ifError)
          .then(() => {
            assert.typeOf(ctx.res.body, 'object', 'we have an object');
          });
      });

      it('if there is no json default option passed in, and no content type application/json header, then parse body as text', () => {
        nock.cleanAll();
        api.get(path).reply(200, responseBody);

        const ctx = createContext(url);
        const fetchTransport = new FetchTransport();

        return fetchTransport
          .execute(ctx)
          .catch(assert.ifError)
          .then(() => {
            assert.typeOf(ctx.res.body, 'string', 'we have text');
          });
      });

      it('if the context options have json set to true, then parse the body as json', () => {
        nock.cleanAll();
        api.get(path).reply(200, JSONResponseBody);

        const ctx = createContext(url);
        const fetchTransport = new FetchTransport();

        ctx.opts = {
          json: true
        };

        return fetchTransport
          .execute(ctx)
          .catch(assert.ifError)
          .then(() => {
            assert.typeOf(ctx.res.body, 'object', 'we have an object');
          });
      });
    });

    describe('HTTP Agent', () => {
      it('selects httpAgent when protocol is http and agent options have been provided', () => {
        const ctx = createContext(url);
        const options = {
          agentOpts: {
            keepAlive: true,
            maxSockets: 1000
          }
        };

        const fetchTransport = new FetchTransport(options);

        const spy = sinon.spy(fetchTransport, '_fetch');

        return fetchTransport
          .execute(ctx)
          .catch(assert.ifError)
          .then(() => {
            sinon.assert.calledWithMatch(spy, url, { agent: {
              protocol: 'http:',
              keepAlive: true,
              maxSockets: 1000
            } });
          });
      });

      it('selects httpsAgent when protocol is https and agent options have been provided', () => {
        const ctx = createContext(httpsUrl);
        const options = {
          agentOpts: {
            keepAlive: true,
            maxSockets: 1000
          }
        };

        const fetchTransport = new FetchTransport(options);

        const spy = sinon.spy(fetchTransport, '_fetch');

        return fetchTransport
          .execute(ctx)
          .catch(assert.ifError)
          .then(() => {
            sinon.assert.calledWithMatch(spy, httpsUrl, { agent: {
              protocol: 'https:',
              keepAlive: true,
              maxSockets: 1000
            } });
          });
      });

      it('selects httpProxyAgent when proxy has been provided', () => {
        const ctx = createContext(url);
        const options = {
          defaults: {
            proxy: proxyUrl
          }
        };

        const fetchTransport = new FetchTransport(options);

        const spy = sinon.spy(fetchTransport, '_fetch');

        return fetchTransport
          .execute(ctx)
          .catch(assert.ifError)
          .then(() => {
            sinon.assert.calledWithMatch(spy, url, { agent: {
              proxy: new URL(proxyUrl),
              protocol: 'http:'
            } });
          });
      });

      it('selects httpProxyAgent when proxy has been provided and applies agent options', () => {
        const ctx = createContext(url);
        const options = {
          agentOpts: {
            keepAlive: true,
            maxSockets: 1000
          },
          defaults: {
            proxy: proxyUrl
          }
        };

        const fetchTransport = new FetchTransport(options);

        const spy = sinon.spy(fetchTransport, '_fetch');

        return fetchTransport
          .execute(ctx)
          .catch(assert.ifError)
          .then(() => {
            sinon.assert.calledWithMatch(spy, url, { agent: {
              proxy: new URL(proxyUrl),
              keepAlive: true,
              maxSockets: 1000
            } });
          });
      });
    });
  });
});
