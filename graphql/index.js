const { graphqlHTTP } = require('express-graphql')
const playground = require('graphql-playground-middleware-express')['default']
const { GraphQLSchema } = require('graphql')

const models = require('../models')
const { generateSchema } = require('./generator')

let schemas = generateSchema(models)

module.exports = {
    graphiqlServer: graphqlHTTP({
        schema: new GraphQLSchema(schemas),
        graphiql: false
    }),
    playground: playground({ endpoint: '/graphql' })
}