var ColorHash = require('color-hash');
var colorHash = new ColorHash();


var User = function () {
	var users = {};
	var bannedUsers = {};

	function claim (user, socketId) {
		if (!user || users[user]) {
			return false;
		} else {
			users[user] = {
				id: socketId,
				color: colorHash.hex(user),
				name: user
			};
			return true;
		}
	};

	function getList (socketId) {
		var res = [];
		var currentUser = getUser(socketId);
		var banList = bannedUsers[currentUser];

		if (!banList) banList = {};

		for (var user in users) {
			if (banList && !banList.hasOwnProperty(user)) {
				res.push(users[user])
			}
		}

		return res.sort();
	};

	function free (socketId) {
		var user = '';
		for (var name in users)
			if (users[name].id === socketId)user = name;

		if (users[user])
			delete users[user];

		return user;
	};

	function getSocketId (user) {
		var socketId = null;
		for (var itemUser in users)
			if (itemUser === user)socketId = users[itemUser].id;

		return socketId;
	};

	function getUser (socketId) {
		var res = null;
		for (var user in users)
			if (users[user].id === socketId)res = user;

		return res;
	};

	function addBan (user, bannedUser) {

		if (!bannedUsers[user]) bannedUsers[user] = {};

		if (!bannedUsers[user][bannedUser])
			bannedUsers[user][bannedUser] = {color: colorHash.hex(bannedUser), name: bannedUser};

	};

	function removeBan (user, bannedUser) {
		if (bannedUsers[user] && bannedUsers[user][bannedUser]) {
			delete bannedUsers[user][bannedUser]
		}
	};


	function getBannedUserList (socketId) {
		var user = getUser(socketId);
		var res = [];

		if (bannedUsers[user]) {
			for (var bannedUser in bannedUsers[user])
				res.push(bannedUsers[user][bannedUser]);
		}

		return res;
	};

	function toggleBanned (socketId, bannedUser, banned) {
		var user = getUser(socketId);

		if (banned)
			removeBan(user, bannedUser);
		else
			addBan(user, bannedUser);

		return getBannedUserList(socketId);
	};

	return {
		claim: claim,
		free: free,
		getSocketId: getSocketId,
		getList: getList,
		getBannedUserList: getBannedUserList,
		getUser: getUser,
		toggleBanned: toggleBanned
	};
};

module.exports = new User();
