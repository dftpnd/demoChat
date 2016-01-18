let instance = null;

class Socket {
	constructor () {
		if (!instance) {
			instance = this;
		}

		this.io = io.connect();

		return instance;
	}
}


module.exports = new Socket();
