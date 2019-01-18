'use strict'
const chalk = require('chalk')
const dotenv = require('dotenv')
const utils = require('./utils/utils')

dotenv.load()
console.log(chalk.magenta('[' + utils.getCurDateStr() + ']Welcome ' + process.env.APP_DESC + ' -- Version:' + process.env.npm_package_version))