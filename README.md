# magic-graph

Automatic graph generator for Sequelize ORM, it&#39;s magic! 🧙‍♂️🧑🏻‍💻

## Installation

This is a [Node.js](https://nodejs.org/) module available through the 
[npm registry](https://www.npmjs.com/). It can be installed using the 
[`npm`](https://docs.npmjs.com/getting-started/installing-npm-packages-locally)
or 
[`yarn`](https://yarnpkg.com/en/)
command line tools.

## Config file example

```sh
{
    "env": "dev",
    "dev": {
        "port": 3001,
        "db": {
            "logger": false,
            "dialect": "mysql",
            "host": "localhost",
            "database": "DB",
            "user": "USER",
            "password": "PASSWORD",
            "port": 3306,
            "force_sync": false,
            "alter_sync": false
        },
        "secret": "crypto-signing"
    }
}
```

## Example

```js
const http = require('http')
const express = require('express')

const graphqlServer = require('./magic-graphql')

const app = express()
const httpServer = http.createServer(app)

// ! GraphQL setup
graphqlServer(app, {
    modelDirPath: '../models', // Or require('../models')
    graphqlEndpint: '/graphql',
    subscriptions: true,
    httpServer: httpServer,
    dataloader: true,
    dataloaderOptions: { 
        max: 500, 
        cache: true, 
        batch: true 
    },
    context: {}
})

httpServer.listen(global.ConfigApp, () => {
    console.log(`✅ Starting server`)
})
```

## Options

  | Option Key | Type | Default | Description |
  | ---------- | ---- | ------- | ----------- |
  | *batch*  | Boolean | `true` | Set to `false` to disable batching, invoking `batchLoadFn` with a single load key. This is equivalent to setting `maxBatchSize` to `1`.
  | *maxBatchSize* | Number | `Infinity` | Limits the number of items that get passed in to the `batchLoadFn`. May be set to `1` to disable batching.
  | *batchScheduleFn* | Function | See [Batch scheduling](#batch-scheduling) | A function to schedule the later execution of a batch. The function is expected to call the provided callback in the immediate future.
  | *cache* | Boolean | `true` | Set to `false` to disable memoization caching, creating a new Promise and new key in the `batchLoadFn` for every load of the same key. This is equivalent to setting `cacheMap` to `null`.
  | *cacheKeyFn* | Function | `key => key` | Produces cache key for a given load key. Useful when objects are keys and two objects should be considered equivalent.
  | *cacheMap* | Object | `new Map()` | Instance of [Map][] (or an object with a similar API) to be used as cache. May be set to `null` to disable caching.

## Dependencies

- [express](https://ghub.io/express): Fast, unopinionated, minimalist web framework
- [express-graphql](https://ghub.io/express-graphql): Production ready GraphQL HTTP middleware.
- [graphql](https://ghub.io/graphql): A Query Language and Runtime which can target any service.
- [graphql-playground-middleware-express](https://ghub.io/graphql-playground-middleware-express): GraphQL IDE for better development workflows (GraphQL Subscriptions, interactive docs &amp; collaboration).
- [graphql-relay](https://ghub.io/graphql-relay): A library to help construct a graphql-js server supporting react-relay.
- [graphql-sequelize](https://ghub.io/graphql-sequelize): GraphQL &amp; Relay for MySQL &amp; Postgres via Sequelize
- [lodash](https://ghub.io/lodash): Lodash modular utilities.
- [mysql2](https://ghub.io/mysql2): fast mysql driver. Implements core protocol, prepared statements, ssl and compression in native JS
- [sequelize](https://ghub.io/sequelize): Multi dialect ORM for Node.JS

## Dev Dependencies

- [nodemon](https://ghub.io/nodemon): Simple monitor script for use during development of a node.js app.

## License

MIT
