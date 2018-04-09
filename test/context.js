'use strict';

const assert = require('assert');
const Context = require('../lib/context');

describe('Context', () => {
  it('defaults retries to an empty array', () => {
    const response = Context.create();
    assert.deepEqual(response.retryAttempts, []);
  });

  it('returns an array of retries', () => {
    const attempts = [{ a: 1 }, { b: 2 }];
    const context = Context.create();
    context.retryAttempts = attempts;
    assert.deepEqual(context.retryAttempts, attempts);
  });

  it('always sets retry attempts to an empty array', () => {
    const attempts = [];
    const context = Context.create();
    context.retryAttempts = 'crazy input';
    assert.deepEqual(context.retryAttempts, attempts);
  });
});
