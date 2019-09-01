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
	console.log(jsonarray)

	const options = {
		method: 'POST',
		uri: mLabUrl,
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
}

const refresh = forceAll => xkcdInFetcher.refresh()
    .then(saveToMLab)
    .catch(console.error)

exports.updateCnListFromMLab = () => {
    const options = {
        uri: mLabUrl,
        json: true
    }
    rp(options).then(x =>{
        // console.log(x)
        console.log("Sync with mLab finished")
        x.map(it => xkcdInFetcher.getCnList()[it.num] = it)
    }).catch(console.eror)
}

exports.latestJson = (req, res) => {
    const cnList = xkcdInFetcher.getCnList()
    const index = Object.keys(cnList).pop()
    res.json(cnList[index])
}

exports.specificJson = (req, res) => {
    const id = req.params.comicId
	console.log("Req specific comic " + id)
    const cnList = xkcdInFetcher.getCnList()
	if (cnList[id] != null && cnList[id] != undefined) {
		res.json(cnList[id])
	} else {
		res.sendStatus(500)
	}
}

exports.refreshNew = (req, res) => {
    refresh(false)
		.then(_ => {
            const cnList = xkcdInFetcher.getCnList()
            const totalNum = xkcdInFetcher.getTotalNum()
			console.log("Refreshed succeed")
			res.status = 200
			res.send("Refreshed succeed, current total num is " + totalNum + ". There are " + Object.keys(cnList).length + " comics saved.")
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