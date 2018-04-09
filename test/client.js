'use strict';

const _ = require('lodash');
const assert = require('chai').assert;
const nock = require('nock');
const sinon = require('sinon');

const HttpTransport = require('..');
const Transport = require('../lib/transport/transport');
const toJson = require('../lib/middleware/asJson');
const setContextProperty = require('../lib/middleware/setContextProperty');
const log = require('../lib/middleware/logger');
const packageInfo = require('../package');

const sandbox = sinon.sandbox.create();

const url = 'http://www.example.com/';
const host = 'http://www.example.com';
const api = nock(host);
const path = '/';

const simpleResponseBody = 'Illegitimi non carborundum';
const requestBody = {
  foo: 'bar'
};
const responseBody = requestBody;

function toUpperCase() {
  return async (ctx, next) => {
    await next();
    ctx.res.body = ctx.res.body.toUpperCase();
  };
}

function nockRetries(retry, opts) {
  const httpMethod = _.get(opts, 'httpMethod') || 'get';
  const successCode = _.get(opts, 'successCode') || 200;

  nock.cleanAll();
  api[httpMethod](path)
    .times(retry)
    .reply(500);
  api[httpMethod](path).reply(successCode);
}

function nockTimeouts(number, opts) {
  const httpMethod = _.get(opts, 'httpMethod') || 'get';
  const successCode = _.get(opts, 'successCode') || 200;

  nock.cleanAll();
  api[httpMethod](path)
    .times(number)
    .socketDelay(10000)
    .reply(200);
  api[httpMethod](path).reply(successCode);
}

function toError() {
  return async (ctx, next) => {
    await next();

    if (ctx.res.statusCode >= 400) {
      const err = new Error('something bad happend.');
      err.statusCode = ctx.res.statusCode;
      err.headers = ctx.res.headers;
      throw err;
    }
  };
}

describe('HttpTransportClient', () => {
  beforeEach(() => {
    nock.disableNetConnect();
    nock.cleanAll();
    api
      .get(path)
      .reply(200, simpleResponseBody)
      .defaultReplyHeaders({
        'Content-Type': 'text/html'
      });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('.get', () => {
    it('returns a response', async () => {
      const res = await HttpTransport.createClient()
        .get(url)
        .asResponse();

      assert.equal(res.body, simpleResponseBody);
    });

    it('sets a default User-agent for every request', async () => {
      nock.cleanAll();

      const HeaderValue = `${packageInfo.name}/${packageInfo.version}`;
      nock(host, {
        reqheaders: {
          'User-Agent': HeaderValue
        }
      })
        .get(path)
        .times(2)
        .reply(200, responseBody);

      const client = HttpTransport.createClient();
      await client.get(url).asResponse();

      return client.get(url).asResponse();
    });

    it('overrides the default User-agent for every request', async () => {
      nock.cleanAll();

      nock(host, {
        reqheaders: {
          'User-Agent': 'some-new-user-agent'
        }
      })
        .get(path)
        .times(2)
        .reply(200, responseBody);

      const client = HttpTransport.createBuilder()
        .userAgent('some-new-user-agent')
        .createClient();

      await client.get(url).asResponse();

      return client.get(url).asResponse();
    });
  });

  describe('default', () => {
    it('sets default retry values in the context', async () => {
      const transport = new Transport();
      sandbox.stub(transport, 'execute').returns(Promise.resolve());

      const client = HttpTransport.createBuilder(transport)
        .retries(50)
        .retryDelay(2000)
        .createClient();

      await client
        .get(url)
        .asResponse();

      const ctx = transport.execute.getCall(0).args[0];
      assert.equal(ctx.retries, 50);
      assert.equal(ctx.retryDelay, 2000);
    });
  });

  describe('.retries', () => {
    it('retries a given number of times for failed requests', async () => {
      nockRetries(2);

      const client = HttpTransport.createBuilder()
        .use(toError())
        .createClient();

      const res = await client
        .get(url)
        .retry(2)
        .asResponse();

      assert.equal(res.statusCode, 200);
    });

    it('retries a given number of times for requests that timed out', async () => {
      nockTimeouts(2);

      const client = HttpTransport.createBuilder()
        .use(toError())
        .createClient();

      const res = await client
        .get(url)
        .timeout(2000)
        .retry(2)
        .asResponse();

      assert.equal(res.statusCode, 200);
    });

    it('waits a minimum of 100ms between retries by default', async () => {
      nockRetries(1);
      const startTime = Date.now();

      const client = HttpTransport.createBuilder()
        .use(toError())
        .createClient();

      const res = await client
        .get(url)
        .retry(2)
        .asResponse();

      const timeTaken = Date.now() - startTime;
      assert(timeTaken > 100);
      assert.equal(res.statusCode, 200);
    });

    it('disables retryDelay if retries if set to zero', async () => {
      nock.cleanAll();
      api.get(path).reply(500);

      const client = HttpTransport.createBuilder()
        .use(toError())
        .createClient();

      try {
        await client
          .get(url)
          .retry(0)
          .retryDelay(10000)
          .asResponse();
      } catch (e) {
        return assert.equal(e.message, 'something bad happend.');
      }

      assert.fail('Should have thrown');
    });

    it('overrides the minimum wait time between retries', async () => {
      nockRetries(1);
      const retryDelay = 200;
      const startTime = Date.now();

      const client = HttpTransport.createBuilder()
        .use(toError())
        .createClient();

      const res = await client
        .get(url)
        .retry(1)
        .retryDelay(retryDelay)
        .asResponse();

      const timeTaken = Date.now() - startTime;
      assert(timeTaken > retryDelay);
      assert.equal(res.statusCode, 200);
    });

    it('does not retry 4XX errors', async () => {
      nock.cleanAll();
      api
        .get(path)
        .once()
        .reply(400);

      const client = HttpTransport.createBuilder()
        .use(toError())
        .createClient();

      try {
        await client
          .get(url)
          .retry(1)
          .asResponse();
      } catch (err) {
        return assert.equal(err.statusCode, 400);
      }
      assert.fail('Should have thrown');
    });
  });

  describe('.post', () => {
    it('makes a POST request', async () => {
      api.post(path, requestBody).reply(201, responseBody);

      const body = await HttpTransport.createClient()
        .post(url, requestBody)
        .asBody();

      assert.deepEqual(body, responseBody);
    });

    it('returns an error when the API returns a 5XX status code', async () => {
      api.post(path, requestBody).reply(500);

      try {
        await HttpTransport.createClient()
          .use(toError())
          .post(url, requestBody)
          .asResponse();
      } catch (err) {
        return assert.equal(err.statusCode, 500);
      }

      assert.fail('Should have thrown');
    });
  });

  describe('.put', () => {
    it('makes a PUT request with a JSON body', async () => {
      api.put(path, requestBody).reply(201, responseBody);

      const body = await HttpTransport.createClient()
        .put(url, requestBody)
        .asBody();

      assert.deepEqual(body, responseBody);
    });

    it('returns an error when the API returns a 5XX status code', async () => {
      api.put(path, requestBody).reply(500);

      try {
        await HttpTransport.createClient()
          .use(toError())
          .put(url, requestBody)
          .asResponse();
      } catch (err) {
        return assert.equal(err.statusCode, 500);
      }

      assert.fail('Should have thrown');
    });
  });

  describe('.delete', () => {
    it('makes a DELETE request', () => {
      api.delete(path).reply(204);
      return HttpTransport.createClient().delete(url);
    });

    it('returns an error when the API returns a 5XX status code', async () => {
      api.delete(path).reply(500);

      try {
        await HttpTransport.createClient()
          .use(toError())
          .delete(url)
          .asResponse();
      } catch (err) {
        return assert.equal(err.statusCode, 500);
      }

      assert.fail('Should have thrown');
    });
  });

  describe('.patch', () => {
    it('makes a PATCH request', async () => {
      api.patch(path).reply(204);
      await HttpTransport.createClient()
        .patch(url)
        .asResponse();
    });

    it('returns an error when the API returns a 5XX status code', async () => {
      api.patch(path, requestBody).reply(500);

      try {
        await HttpTransport.createClient()
          .use(toError())
          .patch(url, requestBody)
          .asResponse();
      } catch (err) {
        return assert.equal(err.statusCode, 500);
      }
      assert.fail('Should have thrown');
    });
  });

  describe('.head', () => {
    it('makes a HEAD request', async () => {
      api.head(path).reply(200);

      const res = await HttpTransport.createClient()
        .head(url)
        .asResponse();

      assert.strictEqual(res.statusCode, 200);
    });

    it('returns an error when the API returns a 5XX status code', async () => {
      api.head(path).reply(500);

      try {
        await HttpTransport.createClient()
          .use(toError())
          .head(url)
          .asResponse();
      } catch (err) {
        return assert.strictEqual(err.statusCode, 500);
      }
      assert.fail('Should have thrown');
    });
  });

  describe('.headers', () => {
    it('sends a custom headers', async () => {
      nock.cleanAll();

      const HeaderValue = `${packageInfo.name}/${packageInfo.version}`;
      nock(host, {
        reqheaders: {
          'User-Agent': HeaderValue,
          foo: 'bar'
        }
      })
        .get(path)
        .reply(200, responseBody);

      const res = await HttpTransport.createClient()
        .get(url)
        .headers({
          'User-Agent': HeaderValue,
          foo: 'bar'
        })
        .asResponse();

      assert.equal(res.statusCode, 200);
    });

    it('ignores an empty header object', async () => {
      const res = await HttpTransport.createClient()
        .headers({})
        .get(url)
        .asResponse();

      assert.equal(res.body, simpleResponseBody);
    });
  });

  describe('query strings', () => {
    it('supports adding a query string', async () => {
      api.get('/?a=1').reply(200, simpleResponseBody);

      const body = await HttpTransport.createClient()
        .get(url)
        .query('a', 1)
        .asBody();

      assert.equal(body, simpleResponseBody);
    });

    it('supports multiple query strings', async () => {
      nock.cleanAll();
      api.get('/?a=1&b=2&c=3').reply(200, simpleResponseBody);

      const body = await HttpTransport.createClient()
        .get(url)
        .query({
          a: 1,
          b: 2,
          c: 3
        })
        .asBody();

      assert.equal(body, simpleResponseBody);
    });

    it('ignores empty query objects', async () => {
      const res = await HttpTransport.createClient()
        .query({})
        .get(url)
        .asResponse();

      assert.equal(res.body, simpleResponseBody);
    });
  });

  describe('.timeout', () => {
    it('sets the a timeout', async () => {
      nock.cleanAll();
      api
        .get('/')
        .socketDelay(1000)
        .reply(200, simpleResponseBody);

      try {
        await HttpTransport.createClient()
          .get(url)
          .timeout(20)
          .asBody();
      } catch (err) {
        return assert.equal(err.message, 'Request failed for GET http://www.example.com/: ESOCKETTIMEDOUT');
      }
      assert.fail('Should have thrown');
    });
  });

  describe('plugins', () => {
    it('supports a per request plugin', async () => {
      nock.cleanAll();
      api
        .get(path)
        .times(2)
        .reply(200, simpleResponseBody);

      const client = HttpTransport.createClient();

      const upperCaseResponse = await client
        .use(toUpperCase())
        .get(url)
        .asBody();

      const lowerCaseResponse = await client
        .get(url)
        .asBody();

      assert.equal(upperCaseResponse, simpleResponseBody.toUpperCase());
      assert.equal(lowerCaseResponse, simpleResponseBody);
    });

    it('executes global and per request plugins', async () => {
      nock.cleanAll();
      api.get(path).reply(200, simpleResponseBody);

      function appendTagGlobally() {
        return async (ctx, next) => {
          await next();
          ctx.res.body = 'global ' + ctx.res.body;
        };
      }

      function appendTagPerRequestTag() {
        return async (ctx, next) => {
          await next();
          ctx.res.body = 'request';
        };
      }

      const client = HttpTransport.createBuilder()
        .use(appendTagGlobally())
        .createClient();

      const body = await client
        .use(appendTagPerRequestTag())
        .get(url)
        .asBody();

      assert.equal(body, 'global request');
    });

    it('throws if a global plugin is not a function', () => {
      assert.throws(
        () => {
          HttpTransport.createBuilder().use('bad plugin');
        },
        TypeError,
        'Plugin is not a function'
      );
    });

    it('throws if a per request plugin is not a function', () => {
      assert.throws(
        () => {
          const client = HttpTransport.createClient();
          client.use('bad plugin').get(url);
        },
        TypeError,
        'Plugin is not a function'
      );
    });

    describe('setContextProperty', () => {
      it('sets an option in the context', async () => {
        nock.cleanAll();
        api.get(path).reply(200, responseBody);

        const client = HttpTransport.createBuilder()
          .use(toJson())
          .createClient();

        const res = client
          .use(setContextProperty({
            time: false
          },
          'opts'
          ))
          .get(url)
          .asResponse();

        assert.isUndefined(res.elapsedTime);
      });

      it('sets an explict key on the context', async () => {
        nock.cleanAll();
        api
          .get(path)
          .socketDelay(1000)
          .reply(200, responseBody);

        const client = HttpTransport.createBuilder()
          .use(toJson())
          .createClient();

        try {
          await client
            .use(setContextProperty(20, 'req._timeout'))
            .get(url)
            .asResponse();
        } catch (err) {
          return assert.equal(err.message, 'Request failed for GET http://www.example.com/: ESOCKETTIMEDOUT');
        }
        assert.fail('Should have thrown');
      });
    });

    describe('toJson', () => {
      it('returns body of a JSON response', async () => {
        nock.cleanAll();
        api
          .defaultReplyHeaders({
            'Content-Type': 'application/json'
          })
          .get(path)
          .reply(200, responseBody);

        const client = HttpTransport.createBuilder()
          .use(toJson())
          .createClient();

        const body = await client
          .get(url)
          .asBody();

        assert.equal(body.foo, 'bar');
      });
    });

    describe('logging', () => {
      it('logs each request at info level when a logger is passed in', async () => {
        api.get(path).reply(200);

        const stubbedLogger = {
          info: sandbox.stub(),
          warn: sandbox.stub()
        };

        const client = HttpTransport.createBuilder()
          .use(log(stubbedLogger))
          .createClient();

        await client
          .get(url)
          .asBody();

        const message = stubbedLogger.info.getCall(0).args[0];
        assert.match(message, /GET http:\/\/www.example.com\/ 200 \d+ ms/);
      });

      it('uses default logger', async () => {
        sandbox.stub(console, 'info');

        const client = HttpTransport.createBuilder()
          .use(log())
          .createClient();

        await client
          .get(url)
          .asBody();

        /*eslint no-console: ["error", { allow: ["info"] }] */
        const message = console.info.getCall(0).args[0];
        assert.match(message, /GET http:\/\/www.example.com\/ 200 \d+ ms/);
      });

      it('doesnt log responseTime when undefined', async () => {
        sandbox.stub(console, 'info');

        const client = HttpTransport.createBuilder()
          .use(log())
          .createClient();

        await client
          .use(setContextProperty({
            time: false
          },
          'opts'
          ))
          .get(url)
          .asBody();

        /*eslint no-console: ["error", { allow: ["info"] }] */
        const message = console.info.getCall(0).args[0];
        assert.match(message, /GET http:\/\/www.example.com\/ 200$/);
      });

      it('logs retry attempts as warnings when they return a critical error', async () => {
        sandbox.stub(console, 'info');
        sandbox.stub(console, 'warn');
        nockRetries(2);

        const client = HttpTransport.createBuilder()
          .use(toError())
          .use(log())
          .createClient();

        await client
          .retry(2)
          .get(url)
          .asBody();

        /*eslint no-console: ["error", { allow: ["info", "warn"] }] */
        sinon.assert.calledOnce(console.warn);
        const intial = console.info.getCall(0).args[0];
        const attempt1 = console.warn.getCall(0).args[0];
        assert.match(intial, /GET http:\/\/www.example.com\/ 500 \d+ ms/);
        assert.match(attempt1, /Attempt 1 GET http:\/\/www.example.com\/ 500 \d+ ms/);
      });
    });
  });
});
