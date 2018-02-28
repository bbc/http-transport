# ADR - HTTP Transport Middleware

## Status
Approved

## Context

[Flashheart](https://github.com/bbc/flashheart), although useful, has become difficult to maintain and extend due to features being coupled into the same client. HttpTransport mitigates this by using `middleware` to extend the Rest clients behaviour. Middleware is comparable to a `plugin` based artitecture. This allows users to add or change behaviour without having to make changes to the core client. This conforms to the [open/closed principle](https://en.wikipedia.org/wiki/Open/closed_principle). 

## Decision

We have decided to use [Koa](https://github.com/koajs/koa) middleware via the [Koa compose](https://github.com/koajs/compose) library, rather than creating our own custom implementation. We opted to use this library because:

* It's a well tested library used extensively in production environments
* Aids the implementation of caching layers (see example above)
* Familiar syntax (express/Koa)
* Supports async/await

### Example middlware stack
```js
async function middleware1(ctx, next) {
  const req = ctx.res // handle request 
  await next();       // invokes the next middleware
  const res = ctx.res // handle response
}

// etc ...
async function middleware2() {}
async function middleware3() {}

// register using `.use` 
httpTransport
  .use(middleware1); 
  .use(middleware2); 
  .use(middleware3); 
```

This would unwind the `stack` in the same way as Express/Koa does:

```
1st middleware ---> 2nd middleware ---> 3rd middleware ---> HTTP request
                                                                 |
                                                                 |
                                                                 v
1st middleware <--- 2nd middleware <--- 3rd middleware <--- HTTP response
```

This aids with modules such as caching with transformations in between:

Caching middleware:
```js
function modifyHeaders(req, res, next) {}
function redisCache(req, res, next) {}

httpTransport.use(modifyHeaders)
             .use(redisCache);
```

Middleware execution order:
```
modifyHeaders ---> redisCache ---> HTTP request
                                        |
                                        |
                                        v
modifyHeaders <--- redisCache <--- HTTP response
```

This ensures the Caching module caches the request as it enters the pipeline and requires the minimum amount of processing to recreate the cache key despite the transport modifying it further.

### Terminating the middleware chain

Terminating a chain is achieved by suppressing the call to `next()`
```js
async function cachingMiddleware(ctx, next) {
  const req = ctx.res 
  if (isCached(req)) {
    return;
  }

  await next(); // call next middleware, allowing chain to continue     
  const res = ctx.res   
  // handle setting caching response
}
```

## Consequences

* Support for Node 8
* Ability to use existing middleware (3rd party) modules 
* No development/maintenance required for middleware library
* Flexibility via the middleware `context`, rather than a more limited signiture like `req`, `res`, `next`
* No control over the execution order of the middleware chain
* Request handling can be easily terminated but due the recursive call stack, response handling can not be terminated. However, the context can be queried where conditional response handling is required.   

