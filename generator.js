const { GraphQLObjectType, GraphQLInputObjectType, GraphQLList, GraphQLInt, GraphQLString, GraphQLNonNull } = require('graphql')
const { resolver, attributeFields, defaultListArgs, defaultArgs } = require('graphql-sequelize')
const { PubSub } = require('graphql-subscriptions')

const { EXPECTED_OPTIONS_KEY } = require('./dataloader')

const _ = require('lodash')
const helper = require('./helper')

const pubSub = new PubSub()

let cache = {} // Cache fix
// Dataloader ⭐️
resolver.contextToOptions = {
    dataloaderContext: [EXPECTED_OPTIONS_KEY]
}

/**
 * Returns the association fields of an entity.
 *
 * It iterates over all the associations and produces an object compatible with GraphQL-js.
 * BelongsToMany and HasMany associations are represented as a `GraphQLList` whereas a BelongTo
 * is simply an instance of a type.
 * @param {*} associations A collection of sequelize associations
 * @param {*} types Existing `GraphQLObjectType` types, created from all the Sequelize models
 */
const generateAssociationFields = (associations, types, isInput = false) => {
    let fields = {}
    for (let associationName in associations) {
        const relation = associations[associationName]
        // BelongsToMany is represented as a list, just like HasMany
        const type = relation.associationType === 'BelongsToMany' ||
            relation.associationType === 'HasMany'
            ? new GraphQLList(types[relation.target.name])
            : types[relation.target.name]

        fields[associationName] = { type }

        if (!isInput) {
            // GraphQLInputObjectType do not accept fields with resolve
            fields[associationName].resolve = resolver(relation)
        }
    }
    return fields
}

/**
 * Returns a new `GraphQLObjectType` created from a sequelize model.
 *
 * It creates a `GraphQLObjectType` object with a name and fields. The
 * fields are generated from its sequelize associations.
 * @param {*} model The sequelize model used to create the `GraphQLObjectType`
 * @param {*} types Existing `GraphQLObjectType` types, created from all the Sequelize models
 */
const generateGraphQLType = (model, types, isInput = false) => {
    const GraphQLClass = isInput ? GraphQLInputObjectType : GraphQLObjectType

    const typeName = model.name.split('_').map(n => _.startCase(_.toLower(n))).join('')

    return new GraphQLClass({
        name: isInput ? `${typeName}Input` : typeName,
        fields: () => Object.assign(
            attributeFields(model, {
                exclude: ['contrasena'],
                allowNull: !!isInput,
                cache
            }),
            generateAssociationFields(model.associations, types, isInput)
        ),
        description: `The name of the model is ${model.name}, this comment is generated automatically.`
    })
}

/**
 * Returns a collection of `GraphQLObjectType` generated from Sequelize models.
 *
 * It creates an object whose properties are `GraphQLObjectType` created
 * from Sequelize models.
 * @param {*} models The sequelize models used to create the types
 */
const generateModelTypes = models => {
    let outputTypes = {}
    let inputTypes = {}
    for (let modelName in models) {
        // Only our models, not Sequelize or sequelize
        if (models[modelName].hasOwnProperty('name') && modelName !== 'Sequelize' && modelName !== 'sequelize' && modelName !== 'Op') {
            outputTypes[modelName] = generateGraphQLType(
                models[modelName],
                outputTypes
            )
            inputTypes[modelName] = generateGraphQLType(
                models[modelName],
                inputTypes,
                true
            )
        }
    }

    return { outputTypes, inputTypes }
}
/**
 * Info type
 */
const infoType = new GraphQLObjectType({
    name: 'info',
    fields: () => ({
        total: { type: GraphQLInt },
        pageSize: { type: GraphQLInt },
        page: { type: GraphQLInt },
    }),
    description: 'Type for api pagination'
})

/**
 * Returns a root `GraphQLObjectType` used as query for `GraphQLSchema`.
 *
 * It creates an object whose properties are `GraphQLObjectType` created
 * from Sequelize models.
 * @param {*} models The sequelize models used to create the root `GraphQLSchema`
 */
const generateQueryRootType = (models, outputTypes) => {
    return new GraphQLObjectType({
        name: 'Query',
        fields: Object.keys(outputTypes).reduce(
            (fields, modelTypeName) => {
                const modelType = outputTypes[modelTypeName]

                /**
                 * ? Antonio
                 * TODO: Mirar si tiene custom resolvers y colocarlos a los de default
                 * 
                 */
                let customs = {}
                if (models[modelTypeName]['options'] && models[modelTypeName]['options']['resolvers'] && models[modelTypeName]['options']['resolvers']['query']) {
                    for (var key in models[modelTypeName]['options']['resolvers']['query']) {
                        if (!models[modelTypeName]['options']['resolvers']['query'].hasOwnProperty(key)) continue;
                        let query = models[modelTypeName]['options']['resolvers']['query'][key]

                        if (typeof query !== 'function') {
                            customs[key] = query
                        } else {
                            customs[key] = {
                                type: new GraphQLList(modelType),
                                args: Object.assign(
                                    defaultArgs(models[modelTypeName]),
                                    defaultListArgs()
                                ),
                                resolve: query
                            }
                        }
                    }
                }

                return Object.assign(fields, {
                    [_.lowerFirst(modelType.name)]: {
                        type: modelType,
                        args: Object.assign(defaultArgs(models[modelTypeName])),
                        resolve: resolver(models[modelTypeName])
                    },
                    [_.camelCase(models[modelTypeName].options.name.plural)]: {
                        type: new GraphQLList(modelType),
                        args: Object.assign(
                            defaultArgs(models[modelTypeName]),
                            defaultListArgs()
                        ),
                        resolve: resolver(models[modelTypeName])
                    },
                    [_.lowerFirst(modelType.name + 'Restful')]: {
                        type: new GraphQLObjectType({
                            name: modelType.name + 'Result',
                            fields: () => ({
                                info: {
                                    type: infoType
                                },
                                results: {
                                    type: new GraphQLList(modelType)
                                }
                            })
                        }),
                        args: Object.assign(
                            defaultArgs(models[modelTypeName]),
                            {
                                page: {
                                    type: GraphQLInt
                                },
                                pageSize: {
                                    type: GraphQLInt
                                },
                                order: {
                                    type: new GraphQLList(new GraphQLList(GraphQLString))
                                }
                            }
                        ),
                        resolve: (parent, args, context) => {
                            let options = {}
                            if (args['where']) {
                                let whereObjectParsed = args['where']
                                for (var key in args['where']) {
                                    var value = args['where'][key]
                                    if (String(value).includes('%')) {
                                        whereObjectParsed[key] = { [models.Op.like]: value }
                                    }
                                }

                                options['where'] = whereObjectParsed
                            }

                            if (args['order']) options['order'] = args['order']

                            options['limit'] = args['pageSize'] ? parseInt(args['pageSize']) : 10
                            options['offset'] = args['page'] ? (args['page'] - 1) * options['limit'] : 0

                            if (!options[EXPECTED_OPTIONS_KEY]) {
                                options[EXPECTED_OPTIONS_KEY] = context['dataloaderContext'] || context
                            }

                            return models[modelTypeName].findAndCountAll(options).then(result => ({
                                info: {
                                    total: result.count,
                                    pageSize: options['limit'],
                                    page: args['page'] || 1
                                },
                                results: result.rows
                            }))
                        }
                    }
                }, customs)
            },
            {}
        )
    })
}

const generateMutationRootType = (models, inputTypes, outputTypes, generateSubscriptions = false) => {
    return new GraphQLObjectType({
        name: 'Mutation',
        fields: Object.keys(inputTypes).reduce(
            (fields, inputTypeName) => {
                const inputType = inputTypes[inputTypeName]
                const key = models[inputTypeName].primaryKeyAttributes[0]

                // Deep hasmany associations
                const includeArrayModels = getDeepAssociations(inputTypeName, models)

                let customs = {}
                if (models[inputTypeName]['options'] && models[inputTypeName]['options']['resolvers'] && models[inputTypeName]['options']['resolvers']['mutation']) {
                    for (var keyMutation in models[inputTypeName]['options']['resolvers']['mutation']) {
                        if (!models[inputTypeName]['options']['resolvers']['mutation'].hasOwnProperty(keyMutation)) continue;
                        let mutation = models[inputTypeName]['options']['resolvers']['mutation'][keyMutation]

                        if (typeof mutation !== 'function') {
                            customs[keyMutation] = mutation
                        } else {
                            customs[keyMutation] = {
                                type: outputTypes[inputTypeName],
                                args: {
                                    [inputTypeName]: { type: inputType }
                                },
                                resolve: mutation
                            }
                        }
                    }
                }

                const toReturn = Object.assign(fields, {
                    [_.camelCase(`add_${inputTypeName}`)]: {
                        type: outputTypes[inputTypeName], // what is returned by resolve, must be of type GraphQLObjectType
                        description: 'Create a ' + inputTypeName,
                        args: {
                            [inputTypeName]: { type: inputType }
                        },
                        resolve: async (source, args, context, info) => {
                            const newObject = await models[inputTypeName].create(args[inputTypeName], { include: includeArrayModels })

                            // SubScription
                            if (generateSubscriptions) pubSub.publish(`${_.toUpper(inputTypeName)}_ADDED`, { [`${_.camelCase(inputTypeName)}Added`]: newObject.dataValues })

                            return newObject
                        }
                    },
                    [_.camelCase(`update_${inputTypeName}`)]: {
                        type: outputTypes[inputTypeName],
                        description: 'Update a ' + inputTypeName,
                        args: {
                            [inputTypeName]: { type: inputType }
                        },
                        resolve: (source, args, context, info) => {
                            let options = {
                                where: { [key]: args[inputTypeName][key] },
                                include: includeArrayModels
                            }

                            if (!options[EXPECTED_OPTIONS_KEY]) {
                                options[EXPECTED_OPTIONS_KEY] = context['dataloaderContext'] || context
                            }

                            // [INFO] Si se manda detalles actualizar los detalles tambien (includes)
                            return models[inputTypeName].findOne(options).then(object2Update => {
                                let promises = []
                                includeArrayModels.forEach(m => {
                                    let model = m.model
                                    if (model.options && model.options.name && model.options.name.plural) {
                                        if (model.options.name.plural in args[inputTypeName]) {
                                            promises.push(helper.upsertArray(models, model.options.name.plural, args[inputTypeName][model.options.name.plural], object2Update, `${inputTypeName}_id`, args[inputTypeName][key], m.include))
                                        }
                                    }
                                })

                                // Actualizar datos
                                promises.push(object2Update.update(args[inputTypeName]))

                                return Promise.all(promises).then(ups => {
                                    // SubScription
                                    if (generateSubscriptions) pubSub.publish(`${_.toUpper(inputTypeName)}_UPDATED`, { [`${[_.camelCase(inputTypeName)]}Updated`]: Object.assign({}, object2Update.dataValues, args[inputTypeName]) })

                                    // `boolean` equals the number of rows affected (0 or 1)
                                    return resolver(models[inputTypeName])(
                                        source,
                                        options.where,
                                        context,
                                        info
                                    )
                                })
                            })
                        }
                    },
                    [_.camelCase(`delete_${inputTypeName}`)]: {
                        type: GraphQLInt,
                        description: 'Delete a ' + inputTypeName,
                        args: {
                            [key]: { type: new GraphQLNonNull(GraphQLInt) }
                        },
                        resolve: async (value, where) => {
                            const deletedRows = await models[inputTypeName].destroy({ where }) // Returns the number of rows affected (0 or 1)

                            // SubScription
                            if (deletedRows > 0 && generateSubscriptions) pubSub.publish(`${_.toUpper(inputTypeName)}_DELETED`, { [`${_.camelCase(inputTypeName)}Deleted`]: where[key] })

                            return deletedRows
                        }
                    }
                }, customs)

                return toReturn
            },
            {}
        )
    })
}

const generateSubscriptionRootType = (inputTypes, outputTypes) => {
    return new GraphQLObjectType({
        name: 'Subscription',
        fields: Object.keys(inputTypes).reduce((fields, inputTypeName) => {
            // UpperCase 
            const inputTypeNameUpperCase = inputTypeName.split('_').map((s, i) => i == 0 ? s : _.upperFirst(s)).join('')

            return Object.assign(fields, {
                [`${inputTypeNameUpperCase}Added`]: {
                    type: outputTypes[inputTypeName],
                    description: `${_.startCase(inputTypeNameUpperCase)} subscription for added event`,
                    // resolve: (payload) => payload,
                    subscribe: (_root, _args) => pubSub.asyncIterator([`${_.toUpper(inputTypeName)}_ADDED`])
                },
                [`${inputTypeNameUpperCase}Updated`]: {
                    type: outputTypes[inputTypeName],
                    description: `${_.startCase(inputTypeNameUpperCase)} subscription for updated event`,
                    subscribe: (_root, _args) => pubSub.asyncIterator([`${_.toUpper(inputTypeName)}_UPDATED`])
                },
                [`${inputTypeNameUpperCase}Deleted`]: {
                    type: GraphQLInt,
                    description: `${_.startCase(inputTypeNameUpperCase)} subscription for deleted event`,
                    subscribe: (_root, _args) => pubSub.asyncIterator([`${_.toUpper(inputTypeName)}_DELETED`])
                }
            })
        }, {})
    })
}

const getDeepAssociations = (modelName, models) => {
    const associations = models[modelName].associations,
        includeArrayModels = []

    for (let associationName in associations) {
        const relation = associations[associationName]

        if (relation.associationType === 'HasMany') {
            includeArrayModels.push({ model: models[relation.target.name], include: getDeepAssociations(relation.target.name, models) })
        }
    }

    return includeArrayModels
}

// This function is exported
const generateSchema = (models, types, generateSubscriptions = false) => {
    const modelTypes = types || generateModelTypes(models)

    const queries = generateQueryRootType(models, modelTypes.outputTypes)
    const mutations = generateMutationRootType(models, modelTypes.inputTypes, modelTypes.outputTypes, generateSubscriptions)

    let schema = {
        query: queries,
        mutation: mutations
    }

    if (generateSubscriptions) schema['subscription'] = generateSubscriptionRootType(modelTypes.inputTypes, modelTypes.outputTypes)

    return schema
}

module.exports = {
    generateGraphQLType,
    generateModelTypes,
    generateSchema
}