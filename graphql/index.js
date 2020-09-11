const { GraphQLSchema } = require('graphql')
const { ApolloServer } = require('apollo-server-express')

const { createContext } = require('./dataloader')

const models = require('../models')
const { generateSchema } = require('./generator')

let schemas = generateSchema(models)

const apolloServer = new ApolloServer({
    schema: new GraphQLSchema(schemas),
    context: {
        dataloaderContext: createContext(models.sequelize, {
            max: 500,
            cache: true, // habilitar cache
            batch: true // habilitar natching
        })
    }
})

module.exports = apolloServer