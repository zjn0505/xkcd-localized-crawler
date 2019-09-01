const cheerio = require("cheerio"),
	rp = require("request-promise"),
	url = require('url'),
	config = require('config'),
	querystring = require("querystring"),
	express = require('express')
	port = config.port

const xkcdCNUrl = "http://xkcd.in/"

const mLabUrl = config.mLabUrl

var cnList = {}

var totalNum

const app = express()

const extractTotalIndicesFromMainHtml = $ => {
	totalNum = parseInt($("span.counts", "h4.main-header").text()) // Total 179 comics
	const totalPages = parseInt($("a", ".footable-page-arrow").last().attr().href.split("=")[2]) // Total 4 pages for 179 comics.
	console.log("Total Num " + totalNum)
	console.log("Total Pages " + totalPages)
	return totalPages
}

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

const updateCnListFromXkcdIn = (list, forceAll) => {
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

const filterBasedOnForceFlag = (list, forceAll) => {
	if (forceAll) {
		return list
	} else {
		return list.filter(it => cnList[it.num] != null && cnList[it.num] != undefined)
	}
}

const refresh = forceAll => rp(xkcdCNUrl)
	.then(cheerio.load)
	.then(extractTotalIndicesFromMainHtml)
	.then(totalPages => [...Array(totalPages).keys()])
	.then(pageArray => pageArray.map(loadLinksFromPageIndex))
	.then(x => Promise.all(x))
	.then(x => [].concat(...x)) // list of all 179 comics links
	.then(x => filterBasedOnForceFlag(x, forceAll))
	.then(x => x.map(loadSingleComicFromXkcdIn))
	.then(x => Promise.all(x))
	.then(x => updateCnListFromXkcdIn(x, forceAll))
	.then(saveToMLab)
	.catch(console.error)

app.get('/refresh', (req, res) => {
	refresh(false)
		.then(_ => {
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
})

app.listen(port)

const updateCnListFromMLab = () => {
	const options = {
		uri: mLabUrl,
		json: true
	}
	rp(options).then(x =>{
		// console.log(x)
		console.log("Sync with mLab finished")
		x.map(it => cnList[it.num] = it)
	}).catch(console.eror)
}

updateCnListFromMLab()