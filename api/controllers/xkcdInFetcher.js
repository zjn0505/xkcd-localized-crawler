'use strict';
const cheerio = require("cheerio"),
	rp = require("request-promise"),
	url = require('url'),
	config = require('config'),
    querystring = require("querystring")
    
const xkcdCNUrl = "http://xkcd.in/"

var totalNum
var cnList = {}

exports.getCnList = () => cnList

exports.getTotalNum = () => totalNum

// parse xkcd.in html for total pages
const extractTotalIndicesFromMainHtml = $ => {
	totalNum = parseInt($("span.counts", "h4.main-header").text()) // Total 179 comics
	const totalPages = parseInt($("a", ".footable-page-arrow").last().attr().href.split("=")[2]) // Total 4 pages for 179 comics.
	console.log("Total Num " + totalNum)
	console.log("Total Pages " + totalPages)
	return totalPages
}

// load all links on specific xkcd.in index page
const loadLinksFromPageIndex = x => {
	x = x + 1
	return rp(xkcdCNUrl + "?lg=cn&page=" + x).then(cheerio.load)
		.then($ => {
			const links = []
			$("#strip_list a").each((i, elm) => {
				const link = $(elm).attr().href
				links.push(link)
			})
			return links
		})
		.catch(e => {
			console.error("Failed to load index of " + x)
			// console.error(e)
		})
}

// load comic object from single xkcd.in page
const loadSingleComicFromXkcdIn = link => {
	return rp(link).then(cheerio.load)
		.then($ => {
			const title = $("#content h1").text()
			var img = $(".comic-body img").attr().src
			img = url.resolve(xkcdCNUrl, img)
			const alt = $(".comic-body .comic-details").text()
			const num = querystring.parse(url.parse(link).query).id
			const comic = {
				_id: num,
				num: num,
				title: title,
				img: img,
				alt: alt
			}
			return comic
		})
		.catch(e => {
			console.error("Failed to load page " + link)
			// console.error(e)
		})
}

// Filter xkcd.in fetched list for single comic page query
const filterBasedOnForceFlag = (list, forceAll) => {
	if (forceAll) {
		return list
	} else {
		return list.filter(it => cnList[it.num] != null && cnList[it.num] != undefined)
	}
}

// Update cnList if not exist
const updateCnListUponXkcdInList = (list, forceAll) => {
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
	return list
}

exports.refresh = forceAll => rp(xkcdCNUrl)
    .then(cheerio.load)
    .then(extractTotalIndicesFromMainHtml)
    .then(totalPages => [...Array(totalPages).keys()])
    .then(pageArray => pageArray.map(loadLinksFromPageIndex))
    .then(x => Promise.all(x))
    .then(x => [].concat(...x)) // list of all 179 comics links
    .then(x => filterBasedOnForceFlag(x, forceAll))
    .then(x => x.map(loadSingleComicFromXkcdIn))
    .then(x => Promise.all(x))
    .then(x => updateCnListUponXkcdInList(x, forceAll))