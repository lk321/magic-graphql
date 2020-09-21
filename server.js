const fs = require('fs')
const http = require('http')
const express = require('express')

const graphqlServer = require('./magic-graphql')

const configApp = JSON.parse(fs.readFileSync('config.json', 'utf8'))
const env = process.env.PRODUCTION ? 'production' : configApp.env

global.ConfigApp = configApp[env]

const app = express()
const httpServer = http.createServer(app)

// ! GraphQL setup
graphqlServer(app, {
    modelDirPath: require('./models'),
    httpServer: httpServer,
    subscriptions: true // Enable graphql subscriptions
})

httpServer.listen(global.ConfigApp, () => {
    console.log(`✅ Starting server on port ${global.ConfigApp.port}`)
})