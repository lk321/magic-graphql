const { GraphQLSchema } = require('graphql')
const { ApolloServer } = require('apollo-server-express')
const compression = require('compression')

const { createContext } = require('./dataloader')
const { generateSchema } = require('./generator')

const defaultOptions = {
    modelDirPath: null,
    customsDirPath: null,
    graphqlEndpint: '/graphql',
    subscriptions: false,
    httpServer: null,
    dataloader: true,
    dataloaderOptions: { max: 500, cache: true, batch: true },
    context: {},
    tracing: false
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
    if (!options.modelDirPath || (typeof options.modelDirPath !== 'string' && typeof options.modelDirPath !== 'object')) throw new Error("options.modelDirPath has an incorrect value, this option is required")
    if (options.dataloader && !options.dataloaderOptions) throw new Error("dataloaderOptions can't be null")
    if (options.subscriptions && !options.httpServer) throw new Error("httpServer is required for subscriptions")
    if (options.customsDirPath && typeof options.customsDirPath !== 'string') throw new Error("options.customsDirPath has an incorrect value")

    let models = null
    if (typeof options.modelDirPath === 'string') models = require(options.modelDirPath)
    else models = options.modelDirPath

    let schemas = generateSchema(models, null, options)

    if (options.dataloader) {
        if (options.context && typeof options.context === 'object') {
            options.context = Object.assign({}, options.context, {
                dataloaderContext: createContext(models.sequelize, options.dataloaderOptions),
                models
            })
        } else if (options.context && typeof options.context === 'function') {
            options.context = (integrationContext) => {
                const optionsContext = options.context(integrationContext)
                return Object.assign({}, optionsContext, {
                    dataloaderContext: createContext(models.sequelize, options.dataloaderOptions),
                    models
                })
            }
        }
    }

    let context = null
    if(options.contextWrapper && typeof options.contextWrapper ==='function'){
        context = options.contextWrapper( options.context )
    }
    else{ context = options.context }

    const graphqlServer = new ApolloServer({
        schema: new GraphQLSchema(schemas),
        context,
        tracing: options.tracing || false
    })
    
    app.use(compression({ level: 1 }))
    graphqlServer.applyMiddleware({ app, path: options.graphqlEndpint, compression: compression() })
    if (options.subscriptions) graphqlServer.installSubscriptionHandlers(options.httpServer)

    return graphqlServer
}