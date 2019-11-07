'use strict';
const cheerio = require("cheerio"),
	rp = require("request-promise"),
	url = require('url'),
	config = require('config'),
	querystring = require("querystring")

const xkcdTwUrl = "https://xkcd.tw/"

var totalNum
var cnList = {}

exports.getLocalList = () => cnList

exports.getTotalNum = () => totalNum

exports.mLabUrl = config.mLabUrlTW

// parse xkcd.tw html for raw archive
const extractRawArchiveFromMainHtml = $ => {
	console.log("WebPage fetched")
	var comicHrefList = $("a", "div#strip_list")
	totalNum = comicHrefList.length
	comicHrefList = comicHrefList.toArray().map(x => {
		return {
			"num": x.attribs.href.substr(1),
			"title": x.childNodes[1].data.trim()
		}
	})
	return comicHrefList
}

// load comic object from single xkcd.tw page
const loadSingleComicFromXkcdTw = item => {
	console.log("Loading " + item.num)
	if (item.num == "1190") {
		return Object.assign(item, {
			alt: "下格待續",
			img: "https://s5.gifyu.com/images/1190.gif"
		})
	}

	const link = xkcdTwUrl + item.num
	return rp(link).then(cheerio.load)
		.then($ => {
			var imgNode = $(`img[src*=strip\\/${item.num}]`)
			const comic = Object.assign(item, {
				alt: imgNode.attr().title,
				img: url.resolve(xkcdTwUrl, imgNode.attr().src)
			})
			return comic
		})
		.catch(e => {
			console.error("Failed to load page " + link)
			console.error(e)
		})
}

// Filter xkcd.tw fetched list for single comic page query
const filterBasedOnForceFlag = (list, forceAll) => {
	if (forceAll) {
		return list
	} else {
		return list.filter(it => {
			const id = it.num
			return cnList[id] == null || cnList[id] == undefined
		})
	}
}

// Update cnList if not exist
const updateLocalListUponXkcdTwList = (list, forceAll) => {
	console.log("1=====================  " + list.length)
	list = list.filter(it => it != null && it != undefined)
	console.log("2=====================  " + list.length)
	list = list.filter(it => {
		if (cnList[it.num] != null && cnList[it.num] != undefined && !forceAll) {
			return false
		} else {
			cnList[it.num] = it
			return true
		}
	})
	console.log("3=====================  " + list.length)
	return list.map(x => {
		x._id = x.num
		return x
	})
}

exports.refresh = (forceAll, index) => {
	console.log("index is " + index)
	if (index == -1) {
		return rp(xkcdTwUrl)
			.then(cheerio.load)
			.then(extractRawArchiveFromMainHtml)
			.then(x => filterBasedOnForceFlag(x, forceAll))
			.then(x => x.map(loadSingleComicFromXkcdTw))
			.then(x => Promise.all(x))
			.then(x => updateLocalListUponXkcdTwList(x, forceAll))
	} else {
		return rp(xkcdTwUrl)
			.then(cheerio.load)
			.then(extractRawArchiveFromMainHtml)
			.then(x => x.filter(n => n.num == index).map(loadSingleComicFromXkcdTw))
			.then(x => Promise.all(x))
			.then(x => updateLocalListUponXkcdTwList(x, forceAll))
	}
}