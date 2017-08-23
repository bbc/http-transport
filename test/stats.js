const sinon = require('sinon');
const nock = require('nock');
const assert = require('chai').assert;
const sandbox = sinon.sandbox.create();

const Blackadder = require('..');
const stats = require('../lib/plugins/stats');

const host = 'http://www.example.com';
const url = 'http://www.example.com/';
const api = nock(host);
const stubbedStats = {
  increment: sandbox.stub(),
  timing: sandbox.stub()
};

function toError() {
  return (ctx, next) => {
    return next().then(() => {
      if (ctx.res.statusCode >= 400) {
        const err = new Error('something bad happend.');
        err.statusCode = ctx.res.statusCode;
        err.headers = ctx.res.headers;
        throw err;
      }
    });
  };
}

describe.only('stats', () => {

  it('increments counter http.requests for each request', () => {
    api.get('/').reply(200);

    return Blackadder.createClient()
      .get(url)
      .use(stats(stubbedStats))
      .asBody()
      .catch(assert.ifError)
      .then(() => {
        sinon.assert.calledWith(stubbedStats.increment, 'http.requests');
      });
  });

  it('increments counter a request counter with the name of the client if one is provided', () => {
    api.get('/').reply(200);

    return Blackadder.createClient()
      .get(url)
      .use(stats(stubbedStats, 'my-client'))
      .asBody()
      .catch(assert.ifError)
      .then(() => {
        sinon.assert.calledWith(stubbedStats.increment, 'my-client.requests');
      });
  });

  it('increments a request counter with the name of the client and feed if provided', () => {
    api.get('/').reply(200);

    return Blackadder.createClient()
      .get(url)
      .use(stats(stubbedStats, 'my-client', 'feedName'))
      .asBody()
      .catch(assert.ifError)
      .then(() => {
        sinon.assert.calledWith(stubbedStats.increment, 'my-client.feedName.requests');
      });
  });

  it('increments counter response for each response', () => {
    api.get('/').reply(200);

    return Blackadder.createClient()
      .get(url)
      .use(stats(stubbedStats, 'my-client', 'feedName'))
      .asBody()
      .catch(assert.ifError)
      .then(() => {
        sinon.assert.calledWith(stubbedStats.increment, 'my-client.feedName.responses.200');
      });
  });

  it('increments counter for errors', () => {
    api.get('/').reply(400);

    return Blackadder.createClient()
      .use(toError())
      .get(url)
      .use(stats(stubbedStats, 'my-client', 'feedName'))
      .asBody()
      .then(assert.fail)
      .catch(() => {
        sinon.assert.calledWith(stubbedStats.increment, 'my-client.feedName.request_errors');
      });
  });
});
