const _ = require('lodash')
const { GraphQLObjectType, GraphQLList, GraphQLInt, GraphQLString } = require('graphql')

const models = require('../../../models')

module.exports = {
    name: 'modelos',
    type: new GraphQLList(new GraphQLObjectType({
        name: 'Modelos',
        fields: () => ({
            name: {
                type: GraphQLString
            },
            physicalName: {
                type: GraphQLString
            }
        })
    })),
    args: {
        page: {
            type: GraphQLInt
        },
        pageSize: {
            type: GraphQLInt
        }
    },
    resolve: (parent, args, context) => {
        let results = []
        for (var m in models) {
            if (models.hasOwnProperty(m) && !['Sequelize', 'sequelize', 'Op'].includes(m)) {
                results.push({
                    name: _.startCase(_.toLower(m.replace('_', ' '))),
                    physicalName: m
                })
            }
        }

        return results
    }
}

