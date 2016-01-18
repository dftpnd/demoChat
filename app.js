'use strict';

/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var app = express();
var socket = require('./server/socket.js');
var server = http.createServer(app);
var appRoutes = ['/', '/login', '/logout', '/chat', '/chat*'];

/* Configuration */
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/dist'));
app.set('port', 3000);

app.get(appRoutes, function (req, res) {
	res.sendFile(path.join(__dirname + '/dist/index.html'));
});

app.use('/dist', express.static('dist'));

if (process.env.NODE_ENV === 'development') {
	app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
}

/* Socket.io Communication */
var io = require('socket.io').listen(server);
io.sockets.on('connection', socket);

/* Start server */
server.listen(app.get('port'), function () {
	console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;

