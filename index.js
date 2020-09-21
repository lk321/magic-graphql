const { GraphQLSchema } = require('graphql')
const { ApolloServer } = require('apollo-server-express')

const { createContext } = require('./dataloader')
const { generateSchema } = require('./generator')

const defaultOptions = {
    modelDirPath: '../models',
    graphqlEndpint: '/graphql',
    subscriptions: false,
    httpServer: null,
    dataloader: true,
    dataloaderOptions: { max: 500, cache: true, batch: true },
    context: {}
}

/**
 * Library's constructor magic-graphql
 * @param {*} app app express object is required
 * @param {*} options Options object, read library documentation for more information
 * 
 * @returns {ApolloServer} Returns object of ApolloServer
 */
module.exports = (app, options = defaultOptions) => {
    options = Object.assign({}, defaultOptions, options)

    if (!app) throw new Error("app is required")
    if (!options.modelDirPath || (typeof options.modelDirPath !== 'string' && typeof options.modelDirPath !== 'object')) throw new Error("options.modelDirPath has an incorrect value")
    if (options.dataloader && !options.dataloaderOptions) throw new Error("dataloaderOptions can't be null")
    if (options.subscriptions && !options.httpServer) throw new Error("httpServer is required for subscriptions")

    let models = null
    if (typeof options.modelDirPath === 'string') models = require(options.modelDirPath)
    else models = options.modelDirPath

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

    graphqlServer.applyMiddleware({ app, path: options.graphqlEndpint })
    if (options.subscriptions) graphqlServer.installSubscriptionHandlers(options.httpServer)

    return graphqlServer
}