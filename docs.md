# HttpTranport

[![Build Status](https://travis-ci.org/nspragg/http-transport.svg)](https://travis-ci.org/nspragg/http-transport) [![Coverage Status](https://coveralls.io/repos/github/nspragg/http-transport/badge.svg?branch=master)](https://coveralls.io/github/nspragg/http-transport?branch=master)

> A flexible rest client that can be easy extended using plugins

## Common examples

The example below prints all of the files in a directory that have the `.json` file extension:

```js
const httpTransport = require('http-transport');


```

#### Supported HTTP methods

Make a HTTP GET request using `.get`

```js
    const url = 'http://example.com/';
    HttpTransport.createClient()
        .get(url)
        .asResponse()
        .then((res) => {
          console.log(res);
        });
```

Make a HTTP POST request using `.post`

```js
   const url = 'http://example.com/';
   HttpTransport.createClient()
        .post(url, requestBody)
        .asResponse()
        .then((res) => {
          console.log(res);
        });
```

#### Query strings

Make a HTTP GET request specifiying query strings using `.query`

```js
    const url = 'http://example.com/';
    HttpTransport.createClient()
        .get(url)
        .query('example', 'true')
        .asResponse()
        .then((res) => {
          console.log(res);
        });
```

#### Headers

Make a HTTP GET request specifiying request headers using `.headers`

```js
    HttpTransport.createClient()
        .get(url)
        .headers({
          'someHeader1' : 'someValue1'
          'someHeader2' : 'someValue2'
        })
        .asResponse()
        .then((res) => {
            console.log(res);
        });
```

#### Handling errors

Convert `Internal Server` responses (500) to errors:

```js
    const toError = require('http-transport-to-errors');

    const url = 'http://example.com/';
    const client = HttpTransport.createClient();
    client.useGlobal(toError()); // for all requests

    client.get(url)
        .asResponse()
        .catch((err) => {
          console.error(err);
        });
```

#### Retries

Make a HTTP GET and retry twice on error `.retry`

```js
const toError = require('http-transport-to-errors');

return HttpTransport.createClient()
        .useGlobal(toError())
        .get('http://example.com/')
        .retry(2)
        .asResponse()
        .catch(assert.ifError)
        .then((res) => {
          assert.equal(res.statusCode, 200);
        });
```

#### Timeouts

Make a HTTP GET and timeout after 50ms `.query`

```js
HttpTransport.createClient()
      .get(url)
      .timeout(50)
      .asBody();
```

#### Using alternative HTTP clients

Make a HTTP GET request and supply a alternative HTTP transport via `.createClient`

```js
const url = 'http://example.com/';
const HttpTransport = require('http-transport');
const Wreck = require('http-transport-wreck');

HttpTransport.createClient(Wreck)
   .get(url)
   .asResponse()
   .then((res) => {
     if (res.statusCode === 200) {
       console.log(res.body);
     }
   });
});
```

#### Offical plugins

See [Callbacks](https://github.com/nspragg/http-transport-callbacks)

See [Wreck](https://github.com/nspragg/http-transport-wreck)

See [Ratelimiting](https://github.com/niklasR/http-transport-simple-rate-limiter)

See [Caching](https://github.com/DaMouse404/http-transport-cache)

See [Errors](https://github.com/nspragg/http-transport-to-error)

See [Response validation](https://github.com/DaMouse404/http-transport-response-validator)

See [Stats](https://github.com/nspragg/stats)

See [Logging](https://github.com/nspragg/logger)
