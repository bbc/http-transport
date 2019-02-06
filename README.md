
[![NPM downloads](https://img.shields.io/npm/dm/@bbc/http-transport.svg?style=flat)](https://npmjs.org/package/@bbc/http-transport)
[![Build Status](https://api.travis-ci.org/bbc/http-transport.svg)](https://travis-ci.org/bbc/http-transport) 
![npm](https://img.shields.io/npm/v/@bbc/http-transport.svg)
![license](https://img.shields.io/badge/license-MIT-blue.svg) 
![github-issues](https://img.shields.io/github/issues/bbc/http-transport.svg)
![stars](https://img.shields.io/github/stars/bbc/http-transport.svg)
![forks](https://img.shields.io/github/forks/bbc/http-transport.svg)

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
