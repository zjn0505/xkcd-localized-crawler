'use strict';
const rp = require("request-promise"),
    config = require('config'),
    xkcdInFetcher = require('./xkcdInFetcher'),
    xkcdTwFetcher = require('./xkcdTwFetcher'),
    xkcdeFetcher = require('./xkcdeFetcher'),
    xkcdFrFetcher = require('./xkcdFrFetcher'),
    xkcdEsFetcher = require('./xkcdEsFetcher'),
    xkcdRuFetcher = require('./xkcdRuFetcher')

const refresh = (forceAll, index, iFetcher) => iFetcher.refresh(forceAll, index)

const getFetcher = req => {
    let iFetcher
    if (req.query.locale == "de") {
        iFetcher = xkcdeFetcher
    } else if (req.query.locale == "zh-tw") {
        iFetcher = xkcdTwFetcher
    } else if (req.query.locale == "fr") {
        iFetcher = xkcdFrFetcher
    } else if (req.query.locale == "es") {
        iFetcher = xkcdEsFetcher
    } else if (req.query.locale == "ru") {
        iFetcher = xkcdRuFetcher
    } else {
        iFetcher = xkcdInFetcher
    }
    return iFetcher
}

exports.refreshNew = (req, res) => {
    let forceAll = req.query["forceAll"] == 1 // TODO not well defined since fetch all comics may fail on some.
    let index = req.query["index"]
    if (!index) {
        index = -1
    }

    let iFetcher = getFetcher(req)

    refresh(forceAll, index, iFetcher)
        .then(results => {
            let list, totalNum
            list = iFetcher.getLocalList()
            totalNum = iFetcher.getTotalNum()
            console.log("Refreshed succeed")
            res.status = 200
            if (index != -1) {
                res.send(`Comic No.${index} has been updated. ${JSON.stringify(results)}`)
            } else {
                res.send(`Refreshed succeed, current total num is ${totalNum}. There are ${Object.keys(list).length} comics saved.`)
            }
            return
        })
        .catch(e => {
            console.log("Refreshed failed, some error happened")
            res.sendStatus(200)
            console.error(e)
        })
}

exports.archive = (req, res) => {
    let iFetcher = getFetcher(req)
    const cnList = iFetcher.getLocalList()
    var html = "<ul>"
    Object.keys(cnList).reverse().map(it => cnList[it]).map(it => `<li><a href=${it.img}> ${it.num} - ${it.title}</a></li>`).map(it => html = html + it)
    html = html + "</ul>"
    res.send(html)
}

exports.pageJson = (req, res) => {
    let iFetcher = getFetcher(req)
    const comicId = req.params.comicId
    const cnList = iFetcher.getLocalList()
    var comic
    if (comicId == undefined) {
        const index = Object.keys(cnList).pop()
        comic = cnList[index]
    } else {
        comic = cnList[comicId]
    }
    if (comic != null && comic != undefined) {
        res.send(comic)
    } else {
        res.sendStatus(400)
    }
}

exports.page = (req, res) => {
    let iFetcher = getFetcher(req)
    const comicId = req.params.comicId
    const cnList = iFetcher.getLocalList()
    var comic
    if (comicId == undefined) {
        const index = Object.keys(cnList).pop()
        comic = cnList[index]
    } else {
        comic = cnList[comicId]
    }
    if (comic != null && comic != undefined) {
        var html = `<h1>${comic.num} - ${comic.title}</h1><img src="${comic.img}" title="${comic.alt}" alt="${comic.title}"/>`
        res.send(html)
    } else {
        res.sendStatus(404)
    }
}