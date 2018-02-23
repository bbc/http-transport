'use strict';

const asJsonPlugin = require('../../lib/plugins/asJson');
const assert = require('chai').assert;
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();

const ctx = {
  res: {
    body: '{}',
    headers: {
      'content-type': 'application/json'
    }
  }
};

function stubPromise() {
  return () => {
    return new Promise((resolve) => {
      resolve();
    });
  };
}

describe('asJson', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('parses json responses', async () => {
    const asJson = asJsonPlugin();

    await asJson(ctx, stubPromise());
    assert.deepEqual(ctx.res.body, {});
  });

  it('supports alternative json content types', async () => {
    const asJson = asJsonPlugin();

    const ctxAlternativeContentType = Object.assign({}, ctx);
    ctxAlternativeContentType.res.headers['content-type'] = 'application/other+json';

    await asJson(ctxAlternativeContentType, stubPromise());
    assert.deepEqual(ctxAlternativeContentType.res.body, {});
  });

  it('always parses response when force is set true', async () => {
    const asJson = asJsonPlugin({
      force: true
    });

    const ctxSimpleBody = {
      res: {
        body: 'a simple string',
        headers: {}
      }
    };

    try {
      await asJson(ctxSimpleBody, stubPromise());
    } catch (e) {
      return assert.match(e.message, /JSON parsing failure:.*/);
    }
    assert.fail('Expected to throw!');
  });

  it('ignores non-json content types.', async () => {
    const asJson = asJsonPlugin();

    const ctxSimpleBody = {
      res: {
        body: 'a simple string',
        headers: {}
      }
    };

    await asJson(ctxSimpleBody, stubPromise());
    assert.deepEqual(ctxSimpleBody.res.body, 'a simple string');
  });

  it('does not parse the response if the body is already an object', async () => {
    sandbox.stub(JSON, 'parse').returns({});

    const asJson = asJsonPlugin();

    const ctxWithJsonBody = {
      res: {
        body: {},
        headers: {}
      }
    };

    await asJson(ctxWithJsonBody, stubPromise());
    sinon.assert.notCalled(JSON.parse);
    assert.deepEqual(ctxWithJsonBody.res.body, {});
  });

  it('throws an error when throw property is set true', async () => {
    const asJson = asJsonPlugin({
      throwOnConflict: true
    });

    const ctxWithSimpleBody = {
      res: {
        body: 'some string',
        headers: {
          'content-type': 'text/html'
        }
      }
    };

    try {
      await asJson(ctxWithSimpleBody, stubPromise());
    } catch (err) {
      return assert.equal(err.message, 'expected a json content type got text/html');
    }
    assert.fail('Expected to throw!');
  });
});
