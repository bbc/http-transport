'use strict';

const asJsonPlugin = require('../../lib/middleware/asJson');
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

  it('parses json responses', () => {
    const asJson = asJsonPlugin();

    return asJson(ctx, stubPromise()).then(() => {
      assert.deepEqual(ctx.res.body, {});
    });
  });

  it('supports alternative json content types', () => {
    const asJson = asJsonPlugin();

    const ctxAlternativeContentType = Object.assign({}, ctx);
    ctxAlternativeContentType.res.headers['content-type'] = 'application/other+json';

    return asJson(ctxAlternativeContentType, stubPromise()).then(() => {
      assert.deepEqual(ctxAlternativeContentType.res.body, {});
    });
  });

  it('always parses response when force is set true', () => {
    const asJson = asJsonPlugin({
      force: true
    });

    const ctxSimpleBody = {
      res: {
        body: 'a simple string',
        headers: {}
      }
    };

    return asJson(ctxSimpleBody, stubPromise()).then(assert.fail).catch((err) => {
      assert.match(err.message, /JSON parsing failure:.*/);
    });
  });

  it('ignores non-json content types.', () => {
    const asJson = asJsonPlugin();

    const ctxSimpleBody = {
      res: {
        body: 'a simple string',
        headers: {}
      }
    };

    return asJson(ctxSimpleBody, stubPromise()).then(() => {
      assert.deepEqual(ctxSimpleBody.res.body, 'a simple string');
    });
  });

  it('does not parse the response if the body is already an object', () => {
    sandbox.stub(JSON, 'parse').returns({});

    const asJson = asJsonPlugin();

    const ctxWithJsonBody = {
      res: {
        body: {},
        headers: {}
      }
    };

    return asJson(ctxWithJsonBody, stubPromise()).then(() => {
      sinon.assert.notCalled(JSON.parse);
      assert.deepEqual(ctxWithJsonBody.res.body, {});
    });
  });

  it('throws an error when throw property is set true', () => {
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

    return asJson(ctxWithSimpleBody, stubPromise()).then(assert.fail)
      .catch((err) => {
        assert.equal(err.message, 'expected a json content type got text/html');
      });
  });
});
