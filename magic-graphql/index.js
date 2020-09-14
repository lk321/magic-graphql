const { GraphQLSchema } = require('graphql')
const { ApolloServer } = require('apollo-server-express')

const { createContext } = require('./dataloader')
const { generateSchema } = require('./generator')

const defaultOptions = {
    modelDirPath: '../models',
    graphqlPath: '/graphql',
    subscriptions: false,
    dataloader: true,
    dataloaderOptions: { max: 500, cache: true, batch: true },
    context: {}
}

/**
 * Library's constructor magic-graphql
 * @param {*} app app express object is required
 * @param {*} httpServer httpServer is required if you enable subscriptions
 * @param {*} options Options object, read library documentation for more information
 * 
 * @returns {ApolloServer} Returns object of ApolloServer
 */
module.exports = (app, httpServer = null, options = defaultOptions) => {
    options = Object.assign({}, defaultOptions, options)

    if (!app) throw new Error("app is required")
    if (!options.modelDirPath || typeof options.modelDirPath !== 'string') throw new Error("options.modelDirPath has an incorrect value")
    if (options.dataloader && !options.dataloaderOptions) throw new Error("dataloaderOptions can't be null")
    if (options.subscriptions && !httpServer) throw new Error("httpServer is required")

    const models = require(options.modelDirPath)

    let schemas = generateSchema(models, null, options.subscriptions)

    if (options.dataloader) {
        if (options.context && typeof options.context === 'object') {
            options.context = Object.assign({}, options.context, {
                dataloaderContext: createContext(models.sequelize, options.dataloaderOptions)
            })
        } else if (options.context && typeof options.context === 'function') {
            options.context = (integrationContext) => {
                const optionsContext = options.context(integrationContext)
                return Object.assign({}, optionsContext, {
                    dataloaderContext: createContext(models.sequelize, options.dataloaderOptions)
                })
            }
        }
    }

    graphqlServer = new ApolloServer({
        schema: new GraphQLSchema(schemas),
        context: options.context
    })

    graphqlServer.applyMiddleware({ app, path: options.graphqlPath })
    if (options.subscriptions) graphqlServer.installSubscriptionHandlers(httpServer)

    return graphqlServer
}