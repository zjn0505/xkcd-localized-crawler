'use strict';
const rp = require("request-promise"),
    config = require('config'),
    xkcdInFetcher = require('./xkcdInFetcher'),
    xkcdTwFetcher = require('./xkcdTwFetcher'),
    xkcdeFetcher = require('./xkcdeFetcher'),
    xkcdFrFetcher = require('./xkcdFrFetcher'),
    xkcdEsFetcher = require('./xkcdEsFetcher'),
    xkcdRuFetcher = require('./xkcdRuFetcher')

const mLabUrl = config.mLabUrl

const execMLabSave = (jsonarray, iFetcher) => {
    let upsertUrl = iFetcher.mLabUrl + `&q={"_id":{"$in":[${jsonarray.map(x => '"'+x._id+'"')}]}}` // TODO Stupid String convert
    console.log(upsertUrl)

    const options = {
        method: 'PUT',
        uri: upsertUrl,
        body: jsonarray,
        json: true
    };
    rp(options).then(body => {
            console.log(body)
        })
        .catch(e => {
            console.error("Failed to save to mLab")
            console.error(e)
        })
}

const saveToMLab = (jsonarray, iFetcher) => {
    if (jsonarray == null || jsonarray == undefined || jsonarray.length == 0) {
        return Promise.resolve()
    }
    console.log("Find sth new")
    console.log(jsonarray)
    if (jsonarray.length > 300) {
        var processArray = jsonarray
        var remainArray
        while (processArray.length > 300) {
            remainArray = processArray.splice(300)
            execMLabSave(processArray, iFetcher)
            processArray = remainArray
        }
        execMLabSave(processArray, iFetcher)
    }
    return jsonarray
}

const refresh = (forceAll, index, iFetcher) => iFetcher.refresh(forceAll, index)
    .then(jsonArray => saveToMLab(jsonArray, iFetcher))
// .catch(console.error)

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

exports.updateLocalListFromMLab = () => {
    var requests = Object.keys(config)
        .filter(key => key.startsWith("mLabUrl"))
        .map(key => config[key])
        .map(mLabUrl => {
            return {
                uri: mLabUrl,
                json: true
            }
        }).map(rp)
    Promise.all(requests)
        .then(x => {
            x.forEach((results, index) => {
                if (results && results instanceof Array) {
                    var region = "CN"
                    if (index == 1) {
                        region = "TW"
                    } else if (index == 2) {
                        region = "DE"
                    } else if (index == 3) {
                        region = "FR"
                    } else if (index == 4) {
                        region = "ES"
                    } else if (index == 5) {
                        region = "RU"
                    }
                    console.log("LIST " + region + " " + results.length)
                }
                console.log("Sync with mLab finished")
                results.map(it => {
                    if (index == 0) {
                        xkcdInFetcher.getLocalList()[it.num] = it
                    } else if (index == 1) {
                        xkcdTwFetcher.getLocalList()[it.num] = it
                    } else if (index == 2) {
                        xkcdeFetcher.getLocalList()[it.num] = it
                    } else if (index == 3) {
                        xkcdFrFetcher.getLocalList()[it.num] = it
                    } else if (index == 4) {
                        xkcdEsFetcher.getLocalList()[it.num] = it
                    } else if (index == 5) {
                        xkcdRuFetcher.getLocalList()[it.num] = it
                    }
                })
            })
        }).catch(console.error)
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