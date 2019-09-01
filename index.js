'use strict';

const rp = require("request-promise"),
	config = require('config'),
	express = require('express'),
	routes = require('./api/routes/xkcdRoutes'),
	port = config.port,
	app = express()

routes.route(app)

app.listen(port)