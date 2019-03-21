'use strict'
const chalk = require('chalk')

function getCurDateStr() {
    let date = new Date()
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

function getDate() {
    let curDate = new Date()
    let offset = -curDate.getTimezoneOffset()

    return new Date(curDate.getTime() + (offset * 60 * 1000))
}

function log(message) {
    console.log(chalk.blue('[' + getCurDateStr() + '] ' + message))
}
module.exports = {
    getCurDateStr,
    getDate,
    log
}