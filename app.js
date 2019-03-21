'use strict'
const chalk = require('chalk')
const dotenv = require('dotenv')
var express = require('express'),
    app = express();
const utils = require('./utils/utils')
const Api = require('./api/server');
const MorganLogger = require('./utils/logger')

class App {
    constructor() {
        dotenv.load();

        this.express = app;

        utils.log(chalk.magenta('Welcome ' + process.env.APP_DESC + ' -- Version:' + process.env.npm_package_version))

        //Logger
        this.logger = new MorganLogger(this)

        // API
        this.api = new Api(this);



        // Start Server
        this.server = app.listen(process.env.REST_PORT, () => {
            utils.log('Listening on ' + process.env.REST_PORT);
        });
    }
}

var app = new App();