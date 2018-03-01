[![Build Status](https://travis-ci.org/bbc/http-transport.svg)](https://travis-ci.org/bbc/http-transport) [![Coverage Status](https://coveralls.io/repos/github/bbc/http-transport/badge.svg?branch=master)](https://coveralls.io/github/bbc/http-transport?branch=master)

# http-transport

> A flexible, modular REST client built for ease-of-use and resilience

## Installation

```
npm install @bbc/http-transport --save
```

## Usage

```js
const url = 'http://example.com/';
const client = require('@bbc/http-transport').createClient();

const res = await client
   .get(url)
   .asResponse();
  
  if (res.statusCode === 200) {
    console.log(res.body);
  }
```

## Documentation
For more examples and API details, see [API documentation](https://bbc.github.io/http-transport)

## Test

```
npm test
```

To generate a test coverage report:

```
npm run coverage
```
