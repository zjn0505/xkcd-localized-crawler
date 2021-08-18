'use strict';
const cheerio = require("cheerio"),
	rp = require("request-promise"),
	url = require('url'),
	config = require('config')

const xkcdRuUrl = "https://xkcd.ru/"

const xkcdRuNumUrl = "https://xkcd.ru/num/"

var totalNum
var ruList = {}

exports.getLocalList = () => ruList

exports.getTotalNum = () => totalNum

const extractRealFromNumUrl = $ => {
	let indexList = $(".real a").map((index, it) => parseInt(it.firstChild.data)).toArray()
	totalNum = indexList.length
	return indexList
}

const extractComicFromSinglePage = index => {
	return rp(xkcdRuUrl + index)
		.then(cheerio.load)
		.then($ => {
			const imgNode = $(".main img")[0]
			const imgUrl = imgNode.attribs.src
			const title = imgNode.attribs.alt
			const alt = $(".main .comics_text").text()

			const comic = {
				_id: index,
				num: index,
				title: title,
				img: imgUrl,
				alt: alt
			}
			console.log("Comic " + index + " loaded")
			ruList[index] = comic
			return comic
		})
}

exports.refresh = (forceAll, index) => {
	console.log("index is " + index)
	if (index == -1) {
		return rp(xkcdRuNumUrl)
			.then(cheerio.load)
			.then(extractRealFromNumUrl)
			.then(indexList => {
				if (forceAll) {
					return indexList.map(extractComicFromSinglePage)
				} else {
					return indexList.filter(i => ruList[i] == null || ruList[i] == undefined).map(extractComicFromSinglePage)
				}
			})
			.then(x => Promise.all(x))
			.then(x => {
				return Object.keys(ruList).map((key) => ruList[key])
			})
	} else {
		return extractComicFromSinglePage(index)
	}
}