'use strict';

const xkcdReqs = require('../controllers/xkcdController')

exports.route = app => {

    xkcdReqs.updateCnListFromMLab()

    app.route('/info.0.json')
        .get(xkcdReqs.latestJson)

    app.route('/:comicId(\\d+)/info.0.json')
        .get(xkcdReqs.specificJson)

    app.route('/refresh')
        .get(xkcdReqs.refreshNew)
}