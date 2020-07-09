const fs = require('fs')
const path = require('path')
const express = require('express')

const configApp = JSON.parse(fs.readFileSync('config.json', 'utf8'))
const env = process.env.PRODUCTION ? 'production' : configApp.env

global.ConfigApp = configApp[env]

const app = express()

// ! GraphQL setup
const { graphiqlServer, playground } = require('./graphql')

app.use('/graphql', graphiqlServer)
app.use('/playground', playground)

app.listen(global.ConfigApp, () => {
    console.log(`✅ Starting server on port ${global.ConfigApp.port}`)
})