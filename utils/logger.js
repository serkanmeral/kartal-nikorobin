'use strict'
const morgan = require('morgan')
const path = require('path')
const fs = require('fs')
const rfs = require('rotating-file-stream')
const EventEmitter = require('events');

class MorganLogger extends EventEmitter {
    constructor(app) {
        super();
        this.app = app;

        let logDirectory = path.join(__dirname, '..', 'logs')
        let loggerFormat = '[PORT : ' + process.env.REST_PORT + '] [:id] [:date[iso]] [":method :url"] [:status] [:response-time]';

        fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)
        var accessLogStream = rfs('accessreq.log', {
            interval: '1d', // rotate daily
            path: logDirectory,
        })
        var errorLogStream = rfs('errorreq.log', {
            interval: '1d', // rotate daily
            path: logDirectory
        })

        morgan.token('id', function getId(req) {
            return req.id
        })

        app.express.use(morgan(loggerFormat))
        app.express.use(morgan(loggerFormat, {
            skip: function (req, res) {
                return res.statusCode >= 400
            },
            stream: accessLogStream
        }))
        app.express.use(morgan(loggerFormat, {
            skip: function (req, res) {
                return res.statusCode < 400
            },
            stream: errorLogStream
        }))
    }
}

module.exports = MorganLogger;