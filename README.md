# magic-graph

Automatic graph generator for Sequelize ORM, it&#39;s magic! 🧙‍♂️🧑🏻‍💻

## Installation

This is a [Node.js](https://nodejs.org/) module available through the 
[npm registry](https://www.npmjs.com/). It can be installed using the 
[`npm`](https://docs.npmjs.com/getting-started/installing-npm-packages-locally)
or 
[`yarn`](https://yarnpkg.com/en/)
command line tools.

```$ yarn add https://github.com/lk321/magic-graph```

## Example

This is an [example](https://github.com/lk321/magic-graph-example) of how to use the library 💪

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
  | *modelDirPath*  | String / Object | `../models` | Path where the models folder is located.
  | *graphqlEndpint*  | String | `/graphql` | GraphQL endpoint.
  | *subscriptions*  | Boolean | `false` | Set to `true` to enable GraphQL subscriptions, this requires an http server.
  | *httpServer* | Object | `null` | HttpServer it is required to be able to use GraphQL subscriptions.
  | *dataloader*  | Boolean | `true` | Set to `false` to disable dataloader.
  | *dataloaderOptions* | Object | `{ ... }` | Dataloader [options](#dataloader-options).
  | *context* | Object | `{}` | Context object.

#### Dataloader options

  | Option Key | Type | Default | Description |
  | ---------- | ---- | ------- | ----------- |
  | *batch*  | Boolean | `true` | Set to `false` to disable batching.
  | *max* | Number | `500` | Limits the number of items that get passed in to the batch. May be set to `1` to disable batching.
  | *cache* | Boolean | `true` | Set to `false` to disable memoization caching.

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
