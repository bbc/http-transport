'use strict';

const asJsonPlugin = require('../../lib/plugins/asJson');
const assert = require('assert');
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();

const opts = {
  force: true
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

  it('does not parse the response if the body is already an object', () => {
    sandbox.stub(JSON, 'parse').returns({});

    const asJson = asJsonPlugin(opts);
    const ctx = {
      res: {
        body: {},
        headers: {}
      }
    };

    return asJson(ctx, stubPromise()).then(() => {
      sinon.assert.notCalled(JSON.parse);
      assert.deepEqual(ctx.res.body, {});
    });
  });
});
