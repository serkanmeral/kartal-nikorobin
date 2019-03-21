'use strict';
var router = require('express').Router();
var bodyParser = require('body-parser')
const EventEmitter = require('events');
var DataGenerator = require('../generator/data-generator')

class Api extends EventEmitter {
    constructor(app) {
        super();
        this.app = app;

        app.express.use(bodyParser.json());
        app.express.use(bodyParser.urlencoded({
            extended: true
        }));

        this.version = {
            version: process.env.VERSION
        };

        this.dataGenerator = new DataGenerator()


        router.get(['/', '/version'], (req, res) => {
            this.GetVersion(req, res);
        });

        router.post(['/', '/add'], (req, res) => {
            this.AddItem(req, res)
        })

        app.express.use('/api/v1', router);
    }

    GetVersion(req, res) {
        res.json(this.version);
    }

    AddItem(req, res) {
        this.dataGenerator.Add(req.body).then((result) => {
            res.status = 200
            res.send(result)
        }).catch((error) => {
            res.status = 400
            res.send(error)
        })
    }
}

module.exports = Api;