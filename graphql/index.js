const { GraphQLSchema } = require('graphql')
const { graphqlHTTP } = require('express-graphql')
const playground = require('graphql-playground-middleware-express')['default']
const { createContext } = require('dataloader-sequelize')

const models = require('../models')
const { generateSchema } = require('./generator')

let schemas = generateSchema(models)

module.exports = {
    graphiqlServer: graphqlHTTP({
        schema: new GraphQLSchema(schemas),
        graphiql: false,
        context: {
            dataloaderContext: createContext(models.sequelize)
        }
    }),
    playground: playground({ endpoint: '/graphql' })
}