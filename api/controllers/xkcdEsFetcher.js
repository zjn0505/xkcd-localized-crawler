'use strict';
const cheerio = require("cheerio"),
	rp = require("request-promise"),
	url = require('url'),
	config = require('config')

const xkcdEsArchiveUrl = "https://es.xkcd.com/archive/"

var totalNum
var esList = {}

exports.getLocalList = () => esList

exports.getTotalNum = () => totalNum

const extractInfoFromSinglePage = $ => {
	const node = $("#middleContent img")
	var num
	try {
		num = parseInt(node.parent().attr("href").split("/")[3])
		if (isNaN(num) || num < 0) {
			throw Error("Invalid")
		}
	} catch (error) {
		if (node && node.attr("src") == "../../site_media/strips/the_drake_equation.png") {
			num = 384
		} else if ($("#middleContent h1").text() == "Dolor de cabeza") {
			const comic = {
				_id: 880,
				num: 880,
				title: "Dolor de cabeza",
				img: "https://es.xkcd.com/site_media/strips/headache.png",
				alt: "Hasta que no mejore la tecnología 3D, solo quiero visitar lagos tranquilos, desiertos de sal y exposiciones de pintura."
			}
			esList[880] = comic
			return
		} else if ($("#middleContent h1").text() == "Huelga de guionistas") {
			num = 360
		} else if ($("#middleContent h1").text() == "133t: Parte 1") {
			num = 341
		} else if ($("#middleContent h1").text() == "Fotos porfa") {
			num = 322
		} else if ($("#middleContent h1").text() == "Día de 28 horas") {
			num = 320
		} else if ($("#middleContent h1").text() == "La hibris del ingeniero") {
			num = 319
		} else if ($("#middleContent h1").text() == "Nostalgia") {
			num = 318
		} else if ($("#middleContent h1").text() == "That Lovin' Feelin'") {
			num = 317
		} else if ($("#middleContent h1").text() == "Braille") {
			num = 315
		} else if ($("#middleContent h1").text() == "Fondo de solteros") {
			num = 314
		} else if ($("#middleContent h1").text() == "Insomnio") {
			num = 313
		} else if ($("#middleContent h1").text() == "Con permiso de Robert Frost") {
			num = 312
		} else if ($("#middleContent h1").text() == "Películas de acción") {
			num = 311
		} else if ($("#middleContent h1").text() == "Compromiso") {
			num = 310
		} else if ($("#middleContent h1").text() == "Equipos para ir a comprar") {
			num = 309
		} else if ($("#middleContent h1").text() == "RTFM") {
			num = 293
		} else if ($("#middleContent h1").text() == "goto") {
			num = 292
		} else if ($("#middleContent h1").text() == "Digno") {
			num = 291
		} else if ($("#middleContent h1").text() == "Putas conchas azules") {
			num = 290
		} else if ($("#middleContent h1").text() == "Solo") {
			num = 289
		} else if ($("#middleContent h1").text() == "Ascensor") {
			num = 288
		} else if ($("#middleContent h1").text() == "NP-Completo") {
			num = 287
		} else if ($("#middleContent h1").text() == "All your base") {
			num = 286
		} else if ($("#middleContent h1").text() == "Agitador wikipedista") {
			num = 285
		} else if ($("#middleContent h1").text() == "Metro") {
			num = 284
		} else if ($("#middleContent h1").text() == "Seguimiento en línea de paquetes") {
			num = 281
		} else if ($("#middleContent h1").text() == "Bibliotecarias") {
			num = 280
		} else if ($("#middleContent h1").text() == "Frases para ligar") {
			num = 279
		} else if ($("#middleContent h1").text() == "Soporte de Black Hat") {
			num = 278
		} else if ($("#middleContent h1").text() == "Semáforo largo") {
			num = 277
		} else if ($("#middleContent h1").text() == "Ancho fijo") {
			num = 276
		} else if ($("#middleContent h1").text() == "Pensamientos") {
			num = 275
		} else if ($("#middleContent h1").text() == "Espectro electromagnético") {
			num = 273
		} else if ($("#middleContent h1").text() == "Usuario de Linux en Best Buy") {
			num = 272
		} else if ($("#middleContent h1").text() == "Potencias de uno") {
			num = 271
		} else if ($("#middleContent h1").text() == "Merlín") {
			num = 270
		} else if ($("#middleContent h1").text() == "TCMP") {
			num = 269
		} else if ($("#middleContent h1").text() == "Elecciones: Parte 5") {
			num = 268
		} else if ($("#middleContent h1").text() == "Elecciones: Parte 4") {
			num = 267
		} else if ($("#middleContent h1").text() == "Elecciones: Parte 3") {
			num = 266
		} else if ($("#middleContent h1").text() == "Elecciones: Parte 2") {
			num = 265
		} else if ($("#middleContent h1").text() == "Elecciones: Parte 1") {
			num = 264
		} else if ($("#middleContent h1").text() == "Certidumbre") {
			num = 263
		} else if ($("#middleContent h1").text() == "A propósito de Mussolini") {
			num = 261
		} else if ($("#middleContent h1").text() == "El collar de cristal") {
			num = 260
		} else if ($("#middleContent h1").text() == "Teorías de la conspiración") {
			num = 258
		} else if ($("#middleContent h1").text() == "Locutores de códigos") {
			num = 257
		} else if ($("#middleContent h1").text() == "Subjetividad") {
			num = 255
		} else if ($("#middleContent h1").text() == "Diagramas de narrativa de películas") {
			num = 657
		} else {
			console.error("Failed to load " + $("#middleContent h1").text())
			return
		}
	}

	const title = node.attr("alt")
	const alt = node.attr("title")
	const img = url.resolve("https://es.xkcd.com/strips/pong/", node.attr("src"))
	const comic = {
		_id: num,
		num: num,
		title: title,
		img: img,
		alt: alt
	}
	esList[num] = comic
}

const extractListFromArchiveUrl = $ => {
	return $("#archive-ul ul").children().map((i, el) => url.resolve(xkcdEsArchiveUrl, $(el).find("a").attr("href"))).toArray()
}

exports.refresh = (forceAll, index) => {
	console.log("index is " + index)
	if (index == -1) {
		return rp(xkcdEsArchiveUrl)
			.then(cheerio.load)
			.then(extractListFromArchiveUrl)
			.then(links => links.map(singleLink => {
				console.log(singleLink)
				return rp(singleLink).then(cheerio.load)
			}))
			.then(x => Promise.all(x))
			.then(x => [].concat(...x))
			.then(x => {
				x.map(extractInfoFromSinglePage)
				totalNum = esList.length
				return Object.keys(esList).map((key) => esList[key])
			})
	} else {
		return Promise.reject(new Error("ES xkcd refresh single entry not implemented yet."))
	}
}