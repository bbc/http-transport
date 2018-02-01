# HttpTranport

> A flexible rest client that can be easy extended using plugins

## Common examples

#### Supported HTTP methods

Make a HTTP GET request using `.get`

```js
    const url = 'http://example.com/';
    await HttpTransport.createClient()
        .get(url)
        .asResponse()
      
    console.log(res);
```

Make a HTTP POST request using `.post`

```js
   const url = 'http://example.com/';
   await HttpTransport.createClient()
        .post(url, requestBody)
        .asResponse()
        
   console.log(res);  
```

PATCH, DELETE, HEAD are also supported. 

#### Query strings

Make a HTTP GET request specifiying query strings using `.query`

Single query string
```js
    const url = 'http://example.com/';
    const res = await HttpTransport.createClient()
        .get(url)
        .query('example', 'true')
        .asResponse();

    console.log(res);
```

Multiple query strings:
```js
    const url = 'http://example.com/';
    const res = await HttpTransport.createClient()
        .get(url)
        .query({
          example1: true
          example2: false
        })
        .asResponse();

    console.log(res);
```


#### Headers

Make a HTTP GET request specifiying request headers using `.headers`

Add a single header:
```js
    await HttpTransport.createClient()
        .get(url)
        .headers('someHeader1', 'someValue1')
        .asResponse();

    console.log(res);
```

Add multiple headers:
```js
    await HttpTransport.createClient()
        .get(url)
        .headers({
          'someHeader1' : 'someValue1'
          'someHeader2' : 'someValue2'
        })
        .asResponse();

    console.log(res);
```

#### Handling errors

Convert `Internal Server` responses (500) to errors:

```js
    const toError = require('@bbc/http-transport-to-error');

    const url = 'http://example.com/';
    const client = HttpTransport.createBuilder()
      .use(toError())
      .createClient();  // for all requests

    await client.get(url)
        .asResponse();

    console.error(err);
```

`toError` is only required if the underlying client does not support HTTP error conversion. 
The default transport is `request`, which does not convert errors. 

#### Retries

Make a HTTP GET and retry twice on error `.retry`

```js
const toError = require('@bbc/http-transport-to-error');

const client = HttpTransport.createBuilder()
        .use(toError())
        .createClient();

        const res = await client.get('http://example.com/')
        .retry(2)
        .asResponse();

        console.log(res);
```

#### Timeouts

Make a HTTP GET and timeout after 50ms `.query`

```js
const body = await HttpTransport.createClient()
      .get(url)
      .timeout(50)
      .asBody();
```

#### Using alternative HTTP clients

Make a HTTP GET request and supply a alternative HTTP transport via `.createClient`

```js
const url = 'http://example.com/';
const HttpTransport = require('@bbc/http-transport');
const OtherTranport = require('some-other-transport');

const res = await HttpTransport.createClient(OtherTranport)
   .get(url)
   .asResponse();

  if (res.statusCode === 200) {
    console.log(res.body);
  }
});
```

#### Offical plugins
See [Caching](https://github.com/bbc/http-transport-cache)

See [Collapsing](https://github.com/bbc/http-transport-request-collapse)

See [Errors](https://github.com/bbc/http-transport-to-error)

See [Stats](https://github.com/bbc/http-transport-statsd)

See [Ratelimiting](https://github.com/bbc/http-transport-rate-limiter)

#### Offical transport decorators 
See [Callbacks](https://github.com/bbc/http-transport-callbacks)