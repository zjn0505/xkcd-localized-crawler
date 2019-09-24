'use strict';
const cheerio = require("cheerio"),
    rp = require("request-promise"),
    url = require('url'),
    config = require('config'),
    querystring = require("querystring"),
    xkcdInFetcher = require('./xkcdInFetcher')

const mLabUrl = config.mLabUrl

const saveToMLab = jsonarray => {
    if (jsonarray == null || jsonarray == undefined || jsonarray.length == 0) {
        return Promise.resolve()
    }
    console.log("Find sth new")
    // console.log(jsonarray)
    let upsertUrl = mLabUrl + `&q={"_id":{"$in":[${jsonarray.map(x => '"'+x._id+'"')}]}}` // TODO Stupid String convert
    console.log(upsertUrl)

    const options = {
        method: 'PUT',
        uri: upsertUrl,
        body: jsonarray,
        json: true
    };
    rp(options).then(body => {
            // console.log(body)
        })
        .catch(e => {
            console.error("Failed to save to mLab")
            // console.error(e)
        })
    return jsonarray
}

const refresh = (forceAll, index) => xkcdInFetcher.refresh(forceAll, index)
    .then(saveToMLab)
    .catch(console.error)

exports.updateCnListFromMLab = () => {
    const options = {
        uri: mLabUrl,
        json: true
    }
    rp(options).then(x => {
        // console.log(x)
        console.log("Sync with mLab finished")
        x.map(it => xkcdInFetcher.getCnList()[it.num] = it)
    }).catch(console.eror)
}

exports.refreshNew = (req, res) => {
    let forceAll = req.query["forceAll"] == 1 // TODO not well defined since fetch all comics may fail on some.
    let index = req.query["index"]
    if (!index) {
        index = -1
    }
    refresh(forceAll, index)
        .then(results => {
            const cnList = xkcdInFetcher.getCnList()
            const totalNum = xkcdInFetcher.getTotalNum()
            console.log("Refreshed succeed")
            res.status = 200
            if (index != -1) {
                res.send(`Comic No.${index} has been updated. ${JSON.stringify(results)}`)
            } else {
                res.send(`Refreshed succeed, current total num is ${totalNum}. There are ${Object.keys(cnList).length} comics saved.`)
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
    const cnList = xkcdInFetcher.getCnList()
    var html = "<ul>"
    Object.keys(cnList).reverse().map(it => cnList[it]).map(it => `<li><a href=${it.img}> ${it.num} - ${it.title}</a></li>`).map(it => html = html + it)
    html = html + "</ul>"
    res.send(html)
}

exports.pageJson = (req, res) => {
    const comicId = req.params.comicId
    const cnList = xkcdInFetcher.getCnList()
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
    const comicId = req.params.comicId
    const cnList = xkcdInFetcher.getCnList()
    var comic
    if (comicId == undefined) {
        const index = Object.keys(cnList).pop()
        comic = cnList[index]
    } else {
        comic = cnList[comicId]
    }
    if (comic != null && comic != undefined) {
        var html = `<h1>${comic.num} - ${comic.title}</h1><img src="${comic.img}" title="${comic.title}" alt="${comic.alt}"/>`
        res.send(html)
    } else {
        res.sendStatus(404)
    }
}