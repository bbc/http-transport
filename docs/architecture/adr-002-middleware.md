# ADR - HTTP Transport Middleware

## Status
Approved

## Context

[Flashheart](https://github.com/bbc/flashheart), although useful, has become difficult to maintain and extend due to features being coupled into the same client. HttpTransport mitigates this by using `middlware` to extend the Rest clients behaviour. Middleware is comparable to a `plugin` based artitecture. This allows users to add or change behaviour without having to the core client. This conforms to the [open/closed principle](https://en.wikipedia.org/wiki/Open/closed_principle). 

## Candidates

### Express/Koa middleware

```js
function middleware(req, res, next) {
}

httpTransport.use(middleware);
```

This would unwind the stack in the same way as Express/Koa does:

```
MW1
MW2
MW3
Request
MW3
MW2
MW1
```

This aids with modules such as caching with transformations in between:

```
Caching MW
Language MW
Request
Language MW
Caching MW
```

This ensures the Caching module caches the request as it enters the pipeline and requires the minimum amount of processing to recreate the cache key despite the transport modifying it further.

### Express/Koa style middleware syntax with same order for pre and post request

This would be the same function syntax as the above but the stack would unwind as follows:

```
MW1
MW2
MW3
Request
MW1
MW2
MW3
```

This would not lend itself to caching:


```
Language MW
Caching MW
Request
Language MW
Caching MW
```

As the cache would require all the input transformations to form a cache key reducing the value of not making the call.

## Decision

HttpTransport uses [Koa](https://github.com/koajs/koa) middleware via the [Koa compose](https://github.com/koajs/compose) library, rather than creating our own custom implementation. We opted to use this library because:

* It's a well tested library used extensively in production environments
* Aids the implementation of caching layers (see example above)
* Familiar syntax 
