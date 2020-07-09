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
