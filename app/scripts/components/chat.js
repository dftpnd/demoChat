'use strict';

var React = require('react');

var socket = io.connect();

var UsersList = React.createClass({
	render() {
		return (
			<article>
				<h3> Online Users: </h3>
				<ul className="list-group">
					{
						this.props.users.map((user, i) => {
							return (
								<li className="list-group-item" key={i}>
									{user}
								</li>
							);
						})
					}
				</ul>
			</article>
		);
	}
});

var Message = React.createClass({
	render() {
		return (
			<div>
				<strong>{this.props.user} :</strong>
				<span>{this.props.text}</span>
			</div>
		);
	}
});

var MessageList = React.createClass({
	render() {
		return (
			<div className="panel-body">
				<h2> Conversation: </h2>
				{
					this.props.messages.map((message, i) => {
						return (
							<Message
								key={i}
								user={message.user}
								text={message.text}
							/>
						);
					})
				}
			</div>
		);
	}
});

var MessageForm = React.createClass({

	getInitialState() {
		return {text: ''};
	},

	handleSubmit(e) {
		e.preventDefault();
		var message = {
			user: this.props.user,
			text: this.state.text
		};
		this.props.onMessageSubmit(message);
		this.setState({text: ''});
	},

	changeHandler(e) {
		this.setState({text: e.target.value});
	},

	render() {
		return (
			<article className="panel-footer clearfix">
				<form onSubmit={this.handleSubmit}>
					<label>Message:</label>
					<input
						onChange={this.changeHandler}
						className='form-control'
						value={this.state.text}
					/>
					<button type='submit' className='btn btn-default pull-right'>Submit</button>
				</form>
			</article>
		);
	}
});

var ChangeNameForm = React.createClass({
	getInitialState() {
		return {newName: ''};
	},

	onKey(e) {
		this.setState({newName: e.target.value});
	},

	handleSubmit(e) {
		e.preventDefault();
		var newName = this.state.newName;
		this.props.onChangeName(newName);
		this.setState({newName: ''});
	},

	render() {
		return (
			<article className="panel-heading">
				<form onSubmit={this.handleSubmit}>
					<div className='form-group'>
						<label>Change name</label>

						<input
							className='form-control'
							onChange={this.onKey}
							value={this.state.newName}
						/>

					</div>
				</form>
			</article>
		);
	}
});

var ChatApp = React.createClass({

	getInitialState() {
		return {users: [], messages: [], text: ''};
	},

	componentDidMount() {
		socket.on('init', this._initialize);
		socket.on('send:message', this._messageRecieve);
		socket.on('user:join', this._userJoined);
		socket.on('user:left', this._userLeft);
		socket.on('change:name', this._userChangedName);
	},

	_initialize(data) {
		var {users, name} = data;
		this.setState({users, user: name});
	},

	_messageRecieve(message) {
		var {messages} = this.state;
		messages.push(message);
		this.setState({messages});
	},

	_userJoined(data) {
		var {users, messages} = this.state;
		var {name} = data;
		users.push(name);
		messages.push({
			user: 'APPLICATION BOT',
			text: name + ' Joined'
		});
		this.setState({users, messages});
	},

	_userLeft(data) {
		var {users, messages} = this.state;
		var {name} = data;
		var index = users.indexOf(name);
		users.splice(index, 1);
		messages.push({
			user: 'APPLICATION BOT',
			text: name + ' Left'
		});
		this.setState({users, messages});
	},

	_userChangedName(data) {
		var {oldName, newName} = data;
		var {users, messages} = this.state;
		var index = users.indexOf(oldName);
		users.splice(index, 1, newName);
		messages.push({
			user: 'APPLICATION BOT',
			text: 'Change Name : ' + oldName + ' ==> ' + newName
		});
		this.setState({users, messages});
	},

	handleMessageSubmit(message) {
		var {messages} = this.state;
		messages.push(message);
		this.setState({messages});
		socket.emit('send:message', message);
	},

	handleChangeName(newName) {
		var oldName = this.state.user;
		socket.emit('change:name', {name: newName}, (result) => {
			if (!result) {
				return alert('There was an error changing your name');
			}
			var {users} = this.state;
			var index = users.indexOf(oldName);
			users.splice(index, 1, newName);
			this.setState({users, user: newName});
		});
	},

	render() {
		return (

			<div >
				<UsersList
					users={this.state.users}
				/>
				<section className="panel panel-default">

					<ChangeNameForm
						onChangeName={this.handleChangeName}
					/>

					<MessageList
						messages={this.state.messages}
					/>

					<MessageForm
						user={this.state.user}
						onMessageSubmit={this.handleMessageSubmit}
					/>

				</section>
			</div>
		);
	}
});

React.render(<ChatApp/>, document.getElementById('app'));
