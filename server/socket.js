var Message = require('../server/message.js');
var User = require('../server/user.js');


module.exports = function (socket) {
	socket.on('send:message', function (data) {
		var message = {
			user: data.sender,
			receiver: data.receiver,
			text: data.text
		};

		var data = Message.save(message);

		if (data.users.indexOf('') === -1) {
			data.users.forEach(function (user) {
				if (user !== User.getUser(socket.id)) {
					var socketId = User.getSocketId(user);
					socket.broadcast.to(socketId).emit('send:message', message);
				}
			});
		} else {
			socket.broadcast.emit('send:message', message);
		}
	});

	socket.on('chat:init', function (data, fn) {
		User.updateSocket(data.user, socket.id);

		var bannedUsers = User.getBannedUserList(socket.id);
		var users = User.getList(socket.id);
		var messages = Message.getList(User.getUserName(socket.id), data.receiver, bannedUsers);

		fn({users: users, bannedUsers: bannedUsers, messages: messages});

		if (data.init) {
			socket.broadcast.emit('user:join', {
				user: User.getUser(socket.id)
			});
		}
	});

	socket.on('chat:update', function (data, fn) {
		User.updateSocket(data.user, socket.id);

		var bannedUsers = User.getBannedUserList(socket.id);
		var users = User.getList(socket.id);
		var messages = Message.getList(User.getUserName(socket.id), data.receiver, bannedUsers);

		fn({users: users, bannedUsers: bannedUsers, messages: messages});

	});


	socket.on('chat:messages', function (data, fn) {
		var bannedUsers = User.getBannedUserList(socket.id);
		var messages = Message.getList(User.getUserName(socket.id), data.receiver, bannedUsers);

		fn({messages: messages});
	});

	socket.on('user:togglebanned', function (data, fn) {
		var bannedUsers = User.toggleBanned(socket.id, data.user, data.banned);
		var users = User.getList(socket.id);
		var messages = Message.getList(User.getUserName(socket.id), data.receiver, bannedUsers);

		fn({users: users, bannedUsers: bannedUsers, messages: messages});
	});

	socket.on('login', function (data, fn) {
		if (User.claim(data.user, socket.id)) {
			socket.broadcast.emit('user:join', {
				user: User.getUser(socket.id)
			});
			fn(true);
		} else {
			fn(false);
		}
	});

	socket.on('logout', function (data, fn) {
		var user = User.getUser(socket.id);

		socket.broadcast.emit('user:left', {
			user: user
		});

		User.free(socket.id);
	});
};
