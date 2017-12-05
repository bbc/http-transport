# ADR - HTTP Transport Middleware

## Status
Approved

## Context

Flashheart was a spaghetti code nightmare which evolved as and when people had requirements. To mitigate this in HTTP Transport it would be better to use a plugin model.

## Candidates

### Express/Koa style middleware syntax

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
