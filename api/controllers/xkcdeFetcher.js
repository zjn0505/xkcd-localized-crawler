'use strict';
const cheerio = require("cheerio"),
	rp = require("request-promise"),
	url = require('url'),
	config = require('config')

const xkcdeUrl = "https://xkcde.dapete.net/"

var totalNum
var deList = {}

exports.getLocalList = () => deList

exports.getTotalNum = () => totalNum

exports.mLabUrl = config.mLabUrlDE

const extractLatestIndexFromMainUrl = $ => {
	const max = parseInt($(".center a").text().split("#")[1])
	console.log("Max index = " + max)
	const title = $(".comictitle").text().split(":")[1].trim()
	console.log("Title = " + title)
	const alt = $("figcaption").text()
	const img = url.resolve(xkcdeUrl, $("figure img").attr().src)
	console.log("Img " + img)
	const comic = {
		_id: max,
		num: max,
		title: title,
		img: img,
		alt: alt
	}
	deList[max] = comic

	const prev = $(".previous").attr()
	if (prev) {
		const prevUrl = url.resolve(xkcdeUrl, prev.href)
		return rp(prevUrl)
			.then(cheerio.load)
			.then(extractLatestIndexFromMainUrl)
	} else {
		return Object.keys(deList).map((key) => deList[key])
	}
}

const extractSingleIndex = index => {
	return rp(xkcdeUrl + index)
		.then(cheerio.load)
		.then($ => {
			const num = parseInt($(".center a").text().split("#")[1])
			console.log("index = " + num)
			if (num != parseInt(index)) {
				return Promise.reject(new Error("This comic has no translation"))
			} else {
				const title = $(".comictitle").text().split(":")[1].trim()
				console.log("Title = " + title)
				const alt = $("figcaption").text()
				const img = url.resolve(xkcdeUrl, $("figure img").attr().src)
				console.log("Img " + img)
				const comic = {
					_id: num,
					num: num,
					title: title,
					img: img,
					alt: alt
				}
				deList[num] = comic
				return Object.keys(deList).map((key) => deList[key])
			}
		})
}

exports.refresh = (forceAll, index) => {
	console.log("index is " + index)
	if (index == -1) {
		return rp(xkcdeUrl)
			.then(cheerio.load)
			.then(extractLatestIndexFromMainUrl)
	} else {
		return extractSingleIndex(index)
	}
}