'use strict';

const _ = require('lodash');
const sinon = require('sinon');
const nock = require('nock');
const assert = require('chai').assert;
const sandbox = sinon.sandbox.create();

const Blackadder = require('..');
const stats = require('../lib/plugins/stats');

const host = 'http://www.example.com';
const url = 'http://www.example.com/';
const api = nock(host);
const path = '/';

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

function nockRetries(retry, opts) {
  const httpMethod = _.get(opts, 'httpMethod') || 'get';
  const successCode = _.get(opts, 'successCode') || 200;

  nock.cleanAll();
  api[httpMethod](path).times(retry).reply(500);
  api[httpMethod](path).reply(successCode);
}

function getCallsWith(spy, arg) {
  return spy.getCalls()
    .filter((call) => {
      return call.args[0] === arg;
    }).length;
}

describe('stats', () => {
  let stubbedStats;

  beforeEach(() => {
    stubbedStats = sandbox.stub();
    stubbedStats.increment = sandbox.stub();
    stubbedStats.timing = sandbox.stub();
  });

  afterEach(() => {
    sandbox.restore();
  });

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
      .use(stats(stubbedStats, 'my-client', 'feedName'))
      .use(toError())
      .get(url)
      .asBody()
      .then(assert.fail)
      .catch(() => {
        sinon.assert.calledWith(stubbedStats.increment, 'my-client.feedName.request_errors');
        sinon.assert.calledOnce(stubbedStats.increment);
      });
  });

  it('increments .retries', () => {
    const retries = 2;

    nockRetries(retries);
    stubbedStats.increment = sinon.spy();

    return Blackadder.createClient()
      .use(stats(stubbedStats, 'my-client', 'feedName'))
      .use(toError())
      .retry(retries)
      .get(url)
      .asBody()
      .then(assert.fail)
      .catch(() => {
        const calls = getCallsWith(stubbedStats.increment, 'my-client.feedName.retries');
        assert.equal(calls, retries);
      });
  });

  it('increments .attempts', () => {
    const retries = 2;

    nockRetries(retries);
    stubbedStats.timing = sinon.spy();

    return Blackadder.createClient()
      .use(stats(stubbedStats, 'my-client', 'feedName'))
      .use(toError())
      .retry(retries)
      .get(url)
      .asBody()
      .then(assert.fail)
      .catch(() => {
        sinon.assert.calledWith(stubbedStats.timing, 'my-client.feedName.attempts', 1);
        sinon.assert.calledWith(stubbedStats.timing, 'my-client.feedName.attempts', 2);
        sinon.assert.calledWith(stubbedStats.timing, 'my-client.feedName.attempts', 3);
      });
  });
});
