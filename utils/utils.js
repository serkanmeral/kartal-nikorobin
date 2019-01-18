'use strict'

module.exports.getCurDateStr = () => {
    let date = new Date()
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

module.exports.getDate = () => {
    let curDate = new Date()
    let offset = -curDate.getTimezoneOffset()

    return new Date(curDate.getTime() + (offset * 60 * 1000))
}