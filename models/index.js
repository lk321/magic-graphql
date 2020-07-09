const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')

const basename = path.basename(module.filename)

var c = null
if (global.ConfigApp) {
    c = global.ConfigApp['db']
} else {
    var configApp = JSON.parse(fs.readFileSync('config.json', 'utf8'))
    c = configApp[configApp.env]['db']
}

const sequelize = new Sequelize(c.database, c.user, c.password, {
    host: c.host,
    port: c.port,
    dialect: c.dialect,
    define: {
        timestamps: false,
        freezeTableName: true
    },
    protocol: 'tcp',
    timezone: "-08:00",
    charset: 'utf8',
    collate: 'utf8_general_ci',
    logging: (!c['logger'] ? false : console.log),
    pool: {
        max: 5, // Never have more than five open connections (max: 5)
        min: 0, // At a minimum, have zero open connections/maintain no minimum number of connections (min: 0)
        idle: 10000 // Remove a connection from the pool after the connection has been idle (not been used) for 10 seconds (idle: 10000)
    }
})

let db = {}
fs.readdirSync(__dirname)
    .filter(file => {
        return file.indexOf(".") !== 0 &&
            file !== basename &&
            (file.slice(-3) === '.js')
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize) // ! OLD => sequelize['import'](path.join(__dirname, file))
        db[model.name] = model
    })

Object.keys(db).forEach(modelName => {
    if ("associate" in db[modelName]) {
        db[modelName].associate(db)
    }
})

db.sequelize = sequelize
db.Sequelize = Sequelize
db.Op = Sequelize.Op

sequelize.sync({
    alter: c['alter_sync'] || false,
    force: c['force_sync'] || false
})
.then(() => console.log('[SYNC SUCCESS] Database\'s sync is finished! 🤖'))
.catch(e => console.log('[SYNC ERROR] => ', e))

module.exports = db