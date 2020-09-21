const _ = require('lodash')

const models = require('../models')

const MODEL = 'MODEL'
const ASSOCIATION = 'ASSOCIATION'
const SEQUELIZE = 'SEQUELIZE'

module.exports = {
    MODEL,
    ASSOCIATION,
    SEQUELIZE,
    methods: (version) => ({
        findByPk: /^[56]/.test(version) ? ['findByPk'] :
            /^[4]/.test(version) ? ['findByPk', 'findById'] :
                ['findById', 'findByPrimary']
    }),
    method: (target, alias) => {
        if (type(target) === MODEL) {
            return module.exports.methods(target.sequelize.constructor.version)[alias][0]
        }
        throw new Error('Unknown target')
    },
    type: (target) => {
        if (target.associationType) {
            return ASSOCIATION
        } else if (/(SequelizeModel|class extends Model)/.test(target.toString()) || models.Sequelize.Model.isPrototypeOf(target)) {
            return MODEL
        } else {
            return SEQUELIZE
        }
    },
    upsert: (modelName, data, idField) => {
        var where = {}
        if (typeof idField === 'string') {
            where[idField] = data[idField]
        } else {
            idField.forEach(f => {
                where[f] = data[f]
            })
        }

        return models[modelName].findOne({
            where
        }).then(info => {
            if (info) {
                // Update
                return info.update(data).then(res => info)
            } else {
                // Insert
                return models[modelName].create(data)
            }
        })
    },
    upsertArray: (array_name, array_data, object_data, father_id, id, modelInclude = []) => {
        var promises = []
        if (Array.isArray(array_data)) {
            if (Array.isArray(object_data[array_name])) {
                promises = object_data[array_name].map(detalle => {
                    var promise = null
                    var found = _.find(array_data, { id: detalle.id })

                    if (found) {
                        promise = detalle.update(found)

                        modelInclude.forEach(m => {
                            if (m && m.model && m.model.options && m.model.options.name && m.model.options.name.plural) {
                                if (m.model.options.name.plural in found) {
                                    if (found.id) {
                                        promises.push(models[array_name.slice(0, -1)].findOne({
                                            where: {
                                                id: found.id
                                            },
                                            include: modelInclude
                                        }).then(object2Update => {
                                            return module.exports.upsertArray(m.model.options.name.plural, found[m.model.options.name.plural], object2Update, `${array_name.slice(0, -1)}_id`, found.id, m.include)
                                        }))
                                    }
                                }
                            }
                        })

                        _.remove(array_data, { id: found.id })
                    } else {
                        // Delete
                        promise = detalle.destroy()
                    }

                    return promise
                })
            }

            array_data.forEach(dat => {
                delete dat['id']
                dat[father_id] = id

                promises.push(models[array_name.slice(0, -1)].create(dat, { include: modelInclude }))
            })
        }

        return promises
    },
    strip_html_tags: (str) => {
        if ((str === null) || (str === ''))
            return false
        else
            str = str.toString()
        return str.replace(/<[^>]*>/g, '')
    },
    cleanExtraSpacing: (string) => (string || "").trim().replace(/\s+/g, " "),
    randomNumber: (low, high) => Math.floor(Math.random() * (high - low) + low),
    getOperatorByString: (str) => {
        const operators = ['*', '/', '+', '-']
        let returnVar = {}
        operators.forEach(o => {
            if (str.includes(o)) {
                let [op1, op2] = str.split(o)

                returnVar[o] = []

                if (isNaN(op1)) {
                    // field
                    returnVar.push({
                        type: 'field',
                        value: op1.trim()
                    })
                } else {
                    // Numero 
                    returnVar.push({
                        type: 'number',
                        value: parseFloat(op1)
                    })
                }
            }
        })

        if (Object.keys(returnVar).length === 0) returnVar['field'] = str.trim()

        return returnVar
    }
}