'use strict';
const cheerio = require("cheerio"),
	rp = require("request-promise"),
	url = require('url'),
	config = require('config')

const xkcdFrUrl = "https://xkcd.lapin.org/"

const xkcdFrSingleUrl = "https://xkcd.lapin.org/index.php?number="

const xkcdFrArchiveUrl = "https://xkcd.lapin.org/tous-episodes.php"

var totalNum
var frList = {}
exports.cachedNum = 0

exports.tag = () => "fr"

exports.getLocalList = () => frList

exports.getTotalNum = () => totalNum

const extractEpisodesFromArchiveUrl = $ => {
	let indexList = $("#content .s").html().trim().split("&#xA0;&#xA0;").map(cheerio.load).map(it => it("a").attr().href.split("number=")[1])
	indexList.pop(1)
	totalNum = indexList.length
	return indexList
}

const extractComicFromSinglePage = index => {
	return rp(xkcdFrSingleUrl + index)
		.then(cheerio.load)
		.then($ => {
			const imgNode = $("#content .s img").filter((i, el) => $(el).attr("title") != null)
			const alt = imgNode.attr("alt")
			var img
			if (imgNode.attr("src")) {
				img = url.resolve(xkcdFrUrl, imgNode.attr("src"))
			} else if (imgNode.attr("href")) {
				img = url.resolve(xkcdFrUrl, imgNode.attr("href"))
			}
			const title = $("#content .s").first("h2").text().trim()
			const comic = {
				_id: index,
				num: index,
				title: title,
				img: img,
				alt: alt
			}
			console.log("Comic " + index + " loaded")
			frList[index] = comic
			return comic
		})
}

exports.refresh = (forceAll, index) => {
	console.log("index is " + index)
	if (index == -1) {
		return rp(xkcdFrArchiveUrl)
			.then(cheerio.load)
			.then(extractEpisodesFromArchiveUrl)
			.then(indexList => {
				if (forceAll) {
					return indexList.map(extractComicFromSinglePage)
				} else {
					return indexList.filter(i => frList[i] == null || frList[i] == undefined).map(extractComicFromSinglePage)
				}
			})
			.then(x => Promise.all(x))
			.then(x => {
				return Object.keys(frList).map((key) => frList[key]) 
			})
	} else {
		return extractComicFromSinglePage(index)
	}
}