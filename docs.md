# HttpTranport

>  A flexible, modular REST client built for ease-of-use and resilience

## Common examples

#### Supported HTTP methods

Make a HTTP GET request using `.get`

```js
    const url = 'http://example.com/';
    const res = await HttpTransport.createClient()
        .get(url)
        .asResponse()
      
    console.log(res);
```

Make a HTTP POST request using `.post`

```js
   const url = 'http://example.com/';
   const res = await HttpTransport.createClient()
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
    const res = await HttpTransport.createClient()
        .get(url)
        .headers('someHeader1', 'someValue1')
        .asResponse();

    console.log(res);
```

Add multiple headers:
```js
    const res = await HttpTransport.createClient()
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

    try {
        await client.get(url)
            .asResponse();
    } catch (err) {
        console.error(err);
    }
```

`toError` is **only** required if the underlying client does not support HTTP error conversion. 
The default transport is `request`, which does **not** convert errors. 

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

#### Using the Client buider 

The builder can be used to define behavior for **all requests**. This includes:
* Default retries 
* Default retry delay
* Default user agent
* Middleware 

The builder is instantiated via `.createBuilder`:
```js
const HttpTransport = require('@bbc/http-transport');
const builder = HttpTransport.createBuilder();
```

`createClient` instantiates a configured transport client:
```js
const url = 'http://example.com/';
const HttpTransport = require('@bbc/http-transport');

const builder = HttpTransport.createBuilder();

const client = builder
    .use(toError())
    .retries(2)
    .createClient();

const body = await client.get(url).asBody();
```

#### Middleware

Middleware are functions that can be executed with before and after a request. Middleware is typically used to: 

* Modify the request object e.g set headers 
* Terminate a request early e.g for caching purposes
* Modify the response object e.g format the response body 

Middlware can be executed **per request** using the `.use` method:
```js
    const exampleMiddleware = require('exampleMiddleware');

    const url = 'http://example.com/';
    const client = HttpTransport.createClient();

    try {
        await client
        .use(exampleMiddleware()) // only for this request         
        .get(url)
        .asResponse();
    } catch (err) {
        console.error(err);
    }
```

Middlware can also be executed **for every request** using the `.use` of the client builder. The client builder is created using the `createBuilder` method:

```js
    const exampleMiddleware = require('exampleMiddleware');

    const url = 'http://example.com/';
    const client = HttpTransport.createBuilder()
      .use(exampleMiddleware()) // for all requests
      .createClient();  

    try {
        await client
        .get(url)
        .asResponse();
    } catch (err) {
        console.error(err);
    }
```

For writing middleware, see the [offical guide](https://github.com/koajs/koa/blob/master/docs/guide.md)

#### Offical HttpTransport middleware
See [Caching](https://github.com/bbc/http-transport-cache)

See [Collapsing](https://github.com/bbc/http-transport-request-collapse)

See [Errors](https://github.com/bbc/http-transport-to-error)

See [Stats](https://github.com/bbc/http-transport-statsd)

See [Ratelimiting](https://github.com/bbc/http-transport-rate-limiter)

See [xray](https://github.com/bbc/http-transport-xray)

#### Using alternative HTTP clients via transport decorators

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

#### Callback support
HttpTransport does not support callbacks. However, to integrate with legacy code, use the [callback adapter](https://github.com/bbc/http-transport-callbacks)
