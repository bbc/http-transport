'use strict';

const _ = require('lodash');
const assert = require('chai').assert;
const nock = require('nock');

const HttpTransport = require('../..');
const CallbackDecorator = require('../../lib/callbacks/decorator');
const toError = require('../toError');
const packageInfo = require('../../package');

const url = 'http://www.example.com/';
const host = 'http://www.example.com';
const api = nock(host);
const path = '/';

const simpleResponseBody = 'Illegitimi non carborundum';
const requestBody = {
    foo: 'bar'
};
const responseBody = requestBody;

function nockRetries(retry, opts) {
    const httpMethod = _.get(opts, 'httpMethod') || 'get';
    const successCode = _.get(opts, 'successCode') || 200;

    nock.cleanAll();
    api[httpMethod](path)
        .times(retry)
        .reply(500);
    api[httpMethod](path).reply(successCode);
}

describe('CallbackDecorator', () => {
    let httpTransport;

    beforeEach(() => {
        httpTransport = HttpTransport.createClient();
        nock.disableNetConnect();
        nock.cleanAll();
        api.get(path).reply(200, simpleResponseBody);
    });

    it('decorates an instance of HttpTransport', (done) => {
        nock.cleanAll();

        nock(host)
            .get(path)
            .reply(200, 'the test passes');

        new CallbackDecorator(httpTransport)
            .get(url)
            .asResponse((err, res) => {
                assert.ifError(err);
                assert.equal(res.statusCode, 200);
                assert.equal(res.body, 'the test passes');
                done();
            });
    });

    describe('.get', () => {
        it('returns a response', (done) => {
            new CallbackDecorator(httpTransport)
                .get(url)
                .asResponse((err, res) => {
                    assert.ifError(err);
                    assert.equal(res.body, simpleResponseBody);
                    done();
                });
        });

        it('sets a default User-agent', (done) => {
            nock.cleanAll();

            const HeaderValue = `${packageInfo.name}/${packageInfo.version}`;
            nock(host, {
                    reqheaders: {
                        'User-Agent': HeaderValue
                    }
                })
                .get(path)
                .reply(200, responseBody);

            new CallbackDecorator(httpTransport)
                .get(url)
                .asResponse(() => {
                    done();
                });
        });

        it('throws if a plugin is not a function', () => {
            assert.throws(
                () => {
                    HttpTransport.createBuilder()
                        .use('bad plugin')
                        .asCallback(httpTransport);
                },
                TypeError,
                'Plugin is not a function'
            );
        });
    });

    describe('timeout', () => {
        it('sets the a timeout', (done) => {
            nock.cleanAll();
            api
                .get('/')
                .socketDelay(1000)
                .reply(200, simpleResponseBody);

            const client = new CallbackDecorator(httpTransport);
            client
                .get(url)
                .timeout(20)
                .asBody((err) => {
                    assert.equal(err, 'Error: Request failed for GET http://www.example.com/: ESOCKETTIMEDOUT');
                    done();
                });
        });
    });

    describe('.retries', () => {
        it('retries a given number of times for failed requests', (done) => {
            nockRetries(2);
            new CallbackDecorator(httpTransport)
                .use(toError())
                .get(url)
                .retry(2)
                .asResponse((err, res) => {
                    assert.ifError(err);
                    assert.equal(res.statusCode, 200);
                    done();
                });
        });

        it('retries a given number of times for failed requests', (done) => {
            nockRetries(2);
            new CallbackDecorator(httpTransport)
                .use(toError())
                .get(url)
                .retry(2)
                .asResponse((err, res) => {
                    assert.ifError(err);
                    assert.equal(res.statusCode, 200);
                    done();
                });
        });

        it('waits a minimum of 100ms between retries by default', (done) => {
            nockRetries(1);
            const startTime = Date.now();

            const client = HttpTransport.createBuilder()
                .use(toError())
                .asCallback()
                .createClient();

            client
                .get(url)
                .retry(2)
                .asResponse((err, res) => {
                    assert.ifError(err);
                    const timeTaken = Date.now() - startTime;
                    assert(timeTaken > 100);
                    assert.equal(res.statusCode, 200);
                    done();
                });
        });

        it('overrides the minimum wait time between retries', (done) => {
            nockRetries(1);
            const retryDelay = 200;
            const startTime = Date.now();

            const client = HttpTransport.createBuilder()
                .use(toError())
                .asCallback()
                .createClient();

            client
                .get(url)
                .retry(2)
                .retryDelay(retryDelay)
                .asResponse((err, res) => {
                    assert.ifError(err);
                    const timeTaken = Date.now() - startTime;
                    assert(timeTaken > retryDelay, 'Responded faster than expected');
                    assert.equal(res.statusCode, 200);
                    done();
                });
        });
    });

    describe('.post', () => {
        it('makes a POST request', (done) => {
            api.post(path, requestBody).reply(201, responseBody);

            new CallbackDecorator(httpTransport)
                .post(url, requestBody)
                .asBody((err, body) => {
                    assert.ifError(err);
                    assert.deepEqual(body, responseBody);
                    done();
                });
        });

        it('returns an error when the API returns a 5XX status code', (done) => {
            api.post(path, requestBody).reply(500);

            const client = HttpTransport.createBuilder(httpTransport)
                .use(toError())
                .asCallback()
                .createClient();

            client.post(url, requestBody).asResponse((err) => {
                assert.ok(err);
                done();
            });
        });
    });

    describe('.put', () => {
        it('makes a PUT request with a JSON body', (done) => {
            api.put(path, requestBody).reply(201, responseBody);

            new CallbackDecorator(httpTransport)
                .put(url, requestBody)
                .asBody((err, body) => {
                    assert.deepEqual(body, responseBody);
                    done();
                });
        });

        it('returns an error when the API returns a 5XX status code', (done) => {
            api.put(path, requestBody).reply(500);

            const client = HttpTransport.createBuilder(httpTransport)
                .use(toError())
                .asCallback()
                .createClient();

            client.put(url, requestBody).asResponse((err) => {
                assert.ok(err);
                done();
            });
        });
    });

    describe('.delete', () => {
        it('makes a DELETE request', (done) => {
            api.delete(path).reply(204);
            new CallbackDecorator(httpTransport)
                .delete(url)
                .asResponse(done);
        });

        it('returns an error when the API returns a 5XX status code', (done) => {
            api.delete(path).reply(500);

            new CallbackDecorator(httpTransport)
                .delete(url)
                .asResponse((err) => {
                    assert.ifError(err);
                    done();
                });
        });
    });

    describe('.patch', () => {
        it('makes a PATCH request', (done) => {
            api.patch(path).reply(204);
            new CallbackDecorator(httpTransport)
                .patch(url)
                .asResponse((err) => {
                    assert.ifError(err);
                    done();
                });
        });

        it('returns an error when the API returns a 5XX status code', (done) => {
            api.patch(path, requestBody).reply(500);

            new CallbackDecorator(httpTransport)
                .patch(url, requestBody)
                .asResponse((err) => {
                    assert.ifError(err);
                    done();
                });
        });
    });

    describe('.head', () => {
        it('makes a HEAD request', (done) => {
            api.head(path).reply(200);

            new CallbackDecorator(httpTransport)
                .head(url)
                .asResponse((err, res) => {
                    assert.ifError(err);
                    assert.strictEqual(res.statusCode, 200);
                    done();
                });
        });

        it('returns an error when the API returns a 5XX status code', (done) => {
            api.head(path).reply(500);

            new CallbackDecorator(httpTransport)
                .head(url)
                .asResponse((err) => {
                    assert.ifError(err);
                    done();
                });
        });
    });

    describe('.headers', () => {
        it('sends a custom headers', (done) => {
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

            new CallbackDecorator(httpTransport)
                .get(url)
                .headers({
                    'User-Agent': HeaderValue,
                    foo: 'bar'
                })
                .asResponse((err, res) => {
                    assert.ifError(err);
                    assert.equal(res.statusCode, 200);
                    done();
                });
        });
    });

    describe('query strings', () => {
        it('supports adding a query string', (done) => {
            api.get('/?a=1').reply(200, simpleResponseBody);

            new CallbackDecorator(httpTransport)
                .get(url)
                .query('a', 1)
                .asBody((err, body) => {
                    assert.ifError(err);
                    assert.equal(body, simpleResponseBody);
                    done();
                });
        });

        it('supports multiple query strings', (done) => {
            nock.cleanAll();
            api.get('/?a=1&b=2&c=3').reply(200, simpleResponseBody);

            new CallbackDecorator(httpTransport)
                .get(url)
                .query({
                    a: 1,
                    b: 2,
                    c: 3
                })
                .asBody((err, body) => {
                    assert.ifError(err);
                    assert.equal(body, simpleResponseBody);
                    done();
                });
        });
    });
});
