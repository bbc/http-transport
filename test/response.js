'use strict';

const assert = require('assert');
const Response = require('../lib/response');

describe('Response', () => {
  it('creates response from static factory', () => {
    const properties = {
      url: 'https://www.example.com',
      body: 'body content',
      status: 200
    };

    const response = Response.create(properties);
    assert.equal(response.url, properties.url);
    assert.equal(response.status, properties.status);
    assert.equal(response.body, properties.body);
  });

  it('gets a header', () => {
    const response = Response.create();
    response.headers = {
      a: 1,
      b: 2
    };

    assert.equal(response.getHeader('a'), 1);
  });

  it('sets a header', () => {
    const response = Response.create();
    response.addHeader('a', 1);

    assert.equal(response.getHeader('a'), 1);
  });

  it('sets headers from an object', () => {
    const response = Response.create();
    response.addHeader({
      a: 1,
      b: 2
    });

    assert.equal(response.getHeader('a'), 1);
    assert.equal(response.getHeader('b'), 2);
  });

  it('sets a multiple headers', () => {
    const response = Response.create();
    const headers = {
      a: 1,
      b: 2
    };
    response.addHeader(headers).addHeader('c', 3);

    assert.equal(response.getHeader('a'), 1);
    assert.equal(response.getHeader('b'), 2);
    assert.equal(response.getHeader('c'), 3);
  });

  it('returns the body length using the Content-Length header', () => {
    const response = Response.create();
    response.headers = {
      'Content-Length': 7
    };

    assert.equal(response.length, 7);
  });

  it('calculates the length of a text body', () => {
    const content = 'xxxxxxxxxx';
    const response = Response.create();
    response.body = content;

    assert.equal(response.length, content.length);
  });

  it('calculates the length of a json body', () => {
    const response = Response.create();
    response.body = {
      x: 1,
      y: 2,
      z: 3
    };

    assert.equal(response.length, 19);
  });

  it('serialises required state', () => {
    const state = {
      url: 'https://www.example.com',
      body: 'body content',
      status: 200
    };

    const response = Response.create(state);

    const asString = JSON.stringify(response);
    const asJson = JSON.parse(asString);
    assert.deepEqual(asJson, state);
  });
});
