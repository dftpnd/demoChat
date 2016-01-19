var Message = function () {
	var messages = {};

	function save (data) {
		var sender = data.user;
		var receiver = data.receiver || '';
		var text = data.text;

		if (!messages.hasOwnProperty(sender)) {
			messages[sender] = [];
		}

		messages[sender].push({
			user: sender,
			receiver: receiver,
			text: text,
			time: new Date().getTime()
		});


		return {
			users: [sender, receiver]
		};
	};

	function compare (a, b) {
		if (a.time < b.time)
			return -1;
		else if (a.time > b.time)
			return 1;
		else
			return 0;
	};

	function isBanned (bannedUsers, name) {
		var res = false;
		bannedUsers.forEach(function (user) {
			if (user.name === name) {
				res = true;
				return;
			}
		});
		return res;
	}

	function getList (currentUser, receiver, bannedUsers) {
		var listMessages = [];
		for (var userName in messages) {
			messages[userName].forEach(function (message) {
				if (!isBanned(bannedUsers, userName)) {
					if (!receiver) {
						if (!message.receiver) {
							listMessages.push(message);
						} else if (message.user === currentUser || message.receiver === currentUser) {
							listMessages.push(message);
						}
					} else if (message.user === currentUser && message.receiver === receiver) {
						listMessages.push(message);
					} else if (message.user === receiver && message.receiver === currentUser) {
						listMessages.push(message);
					}
				}
			});
		}
		return listMessages.sort(compare);
	};

	return {
		save: save,
		getList: getList
	}
};


module.exports = new Message();
