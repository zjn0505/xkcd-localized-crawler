'use strict';

const xkcdReqs = require('../controllers/xkcdController')

exports.route = app => {

    xkcdReqs.updateLocalListFromMLab()

    app.route('/refresh')
        .get(xkcdReqs.refreshNew)

    app.route('/archive')
        .get(xkcdReqs.archive)

    app.route('/:comicId(\\d+)?/info.0.json')
        .get(xkcdReqs.pageJson)

    app.route('/:comicId(\\d+)?')
        .get(xkcdReqs.page)
}