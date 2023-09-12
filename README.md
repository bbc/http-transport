
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

## TypeScript
Types are included in this project, and they also work with plugins.

Just pass the types that your plugin will add to `context` as a generic. This will be overlayed on top of any types added by previous plugins in the chain.

E.g.

```ts
const addSessionData: Plugin<{ session: { userId: string } } }> = (context, next) => {
  context.session = { userId: 'some-user' };
};

const res = await client
  .use(addSessionData)
  .use((context, next) => {
    if (context.session.userId === 'some-user') { // this would error if addSessionData middleware was missing
      // do something
    }
  })
  .use<{res: { random: number } }>((context, next) => {
    context.res.random = Math.random();
  })
  .get(url)
  .asResponse();

console.log(res.random); // number
```

## Opting Out
If you don't want to type your plugin, simply use `any` as the type. This is not recommended though as it means all plugins later in the chain will lose the types too, because they have no idea what changes were made.

```ts
const myPlugin: Plugin<any> = (context, next) => {};
```

## Test

```
npm test
```

To generate a test coverage report:

```
npm run coverage
```
