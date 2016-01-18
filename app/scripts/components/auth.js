import Socket from '../components/socket'

let instance = null;

class Auth {
	constructor () {
		if (!instance) {
			instance = this;
		}

		this.user = '' || localStorage.user;

		return instance;
	}
}

Auth.prototype.login = function (user, cb) {
	var loginUser = user || localStorage.user;

	if (loginUser) {
		Socket.io.emit('login', {user: loginUser}, (isLogin) => {
			if (isLogin) {
				localStorage.user = loginUser;
				this.user = loginUser;
				if (cb) cb(true);
				this.onChange(true);
			} else {
				if (cb) cb(false);
				this.onChange(false);
			}
		});
	}
};

Auth.prototype.logout = function (cb) {
	if (cb) cb();
	Socket.io.emit('logout', {user: this.user});
	delete localStorage.user;
	this.user = '';
	this.onChange(false);
};

Auth.prototype.loggedIn = function () {
	return !!this.user;
};

Auth.prototype.getUser = function () {
	return this.user;
};

Auth.prototype.onChange = function () {

};

module.exports = new Auth();
