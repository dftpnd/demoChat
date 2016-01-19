'use strict';
import {Link} from 'react-router'
import React from 'react'
import Auth from '../components/auth'
import Socket from '../components/socket'
import classNames from 'classnames'

var UserPick = React.createClass({
	render(){
		var userpickBadge = {
			background: this.props.color
		};

		return (
		  <div className="user-pick">
			  <div style={userpickBadge} className="userpick-badge"><span>{this.props.badge}</span></div>
			  <div className="userpick-name">{this.props.name}</div>
		  </div>
		)
	}
});
var UsersListItem = React.createClass({
	handleClick: function (event) {
		this.props.handleToggleBanUser({user: this.props.name, banned: this.props.ban});
	},
	render(){
		var addBanClass = classNames({
			'btn-toggle': true,
			'hidden': (this.props.ban ? true : false)
		});
		var addListClass = classNames({
			'btn-toggle': true,
			'hidden': (this.props.ban ? false : true)
		});


		return (
		  <div>
			  <Link className="chat-userpick"
					to={this.props.url}
					activeClassName="active"
					onlyActiveOnIndex={true}>
				  <UserPick badge={this.props.badge} name={this.props.name} color={this.props.color}/>
			  </Link>
			  <button className={addBanClass} onClick={this.handleClick} type="button">x</ button >
			  <button className={addListClass} onClick={this.handleClick} type="button">+</ button >
		  </div>
		)
	}
});
var Aside = React.createClass({
	render() {
		var banListClass = classNames({
			'hidden': (this.props.bannedUsers.length === 0)
		});

		return (
		  <aside>
			  <header>
				  <UserPick badge={this.props.user.charAt(0)} name={this.props.user} color={this.props.userColor}/>
				  <Link to={'/login'}>Выйти</Link>
			  </header>

			  <ul className="user-list">
				  <li className="all-users">
					  <UsersListItem
						name="Все участники"
						badge={this.props.users.length - 1}
						url="/chat"
					  />
				  </li>
				  {
					  this.props.users.map((user, i) => {
						  if (user.name !== Auth.getUser()) {
							  return (
								<li key={i}>
									<UsersListItem
									  name={user.name}
									  badge={user.name.charAt(0)}
									  handleToggleBanUser={this.props.handleToggleBanUser}
									  url={`/chat/${user.name}`}
									  color={user.color}
									/>
								</li>
							  );
						  }
					  })
				  }
			  </ul>

			  <div className={banListClass}>
				  <div className="list-title">Исключения</div>
				  <ul className="ban-list">
					  {
						  this.props.bannedUsers.map((user, i) => {
							  return (
								<li key={i}>
									<UsersListItem
									  name={user.name}
									  badge={user.name.charAt(0)}
									  url={`/chat/${user.name}`}
									  handleToggleBanUser={this.props.handleToggleBanUser}
									  ban="true"
									  color={user.color}
									/>
								</li>
							  );
						  })
					  }
				  </ul>
			  </div>
		  </aside>
		);
	}
});

var Message = React.createClass({
	componentDidMount() {
		window.scrollTo(0, document.body.scrollHeight);
	},
	addToField(){
		this.props.updateMessageField([this.props.user, ', '].join(''));
	},
	render() {
		var messageBgClass = classNames({
			'bg-message': true,
			'hidden': (this.props.receiver ? false : true)
		});
		var messageColor = {
			background: this.props.color
		};
		return (
		  <li>
			  <div style={messageColor} className={messageBgClass}></div>
			  <label className="chat-item-message" htmlFor="message-field" onClick={this.addToField}>
				  <UserPick badge={this.props.user.charAt(0)} name={this.props.user} color={this.props.color}/>
				  <span className="chat-message-text">{this.props.text}</span>
			  </label>
		  </li>
		);
	}
});

var MessageList = React.createClass({
	render() {
		var viewColor = {
			background: this.props.chatColor
		};
		return (
		  <div className="chat-messages">
			  <div style={viewColor} className="chat-bg"></div>
			  <ul>
				  {
					  this.props.messages.map((message, i) => {
						  return (
							<Message
							  key={i}
							  user={message.user}
							  text={message.text}
							  receiver={message.receiver}
							  color={this.props.getUserColor(message.user)}
							  updateMessageField={this.props.updateMessageField}
							/>
						  );
					  })
				  }
			  </ul>
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
		var userBg = {
			background: this.props.userColor
		};
		return (
		  <article className="chat-form">
			  <div className="user-bg" style={userBg}></div>
			  <form onSubmit={this.handleSubmit}>
				  <div className="user-preview">
					  <span style={userBg}>{this.props.user.charAt(0)}</span>
				  </div>
				  <input
					id={this.props.messageFieldId}
					onChange={this.changeHandler}
					className='form-control'
					value={this.state.text}
					autoComplete="off"
					type="text"
					placeholder="Напишите сообщение"
					autoFocus
				  />
			  </form>
		  </article>
		);
	}
});

var Chat = React.createClass({
	getInitialState() {
		return {
			users: [],
			bannedUsers: [],
			messages: [],
			text: '',
			user: Auth.getUser(),
			messageFieldId: 'message-field',
			userColor: '',
			chatColor: '',
		};
	},

	componentDidMount() {
		Socket.io.on('send:message', this._messageRecieve);
		Socket.io.on('user:join', this._userJoined);
		Socket.io.on('user:left', this._userLeft);
		this._update(true);
	},
	componentWillUnmount(){
		Socket.io.off('send:message');
		Socket.io.off('user:join');
		Socket.io.off('user:left');
	},
	componentWillReceiveProps: function (nextProps) {
		this._getMessages(nextProps.params.receiver);
		this._updateChatColor(nextProps.params.receiver);
	},
	_update: function (init, callback) {
		var data = {user: this.state.user, receiver: this.props.params.receiver, init: init};
		Socket.io.emit('chat:init', data, (res)=> {
			let {users, messages, bannedUsers} = res;
			this.setState({users, messages, bannedUsers});
			this._updateChatColor(this.props.params.receiver);

			users.forEach((user)=> {
				if (user.name === this.state.user) {
					this.setState({userColor: user.color});
				}
			});

			if (callback)
				callback(res);
		});
	},
	_updateChatColor(user){
		var color = this.getUserColor(user);
		this.setState({chatColor: color});
	},
	_messageRecieve(message) {
		if (this._isBannedUser(message.user)) return;

		var {messages} = this.state;
		messages.push(message);
		this.setState({messages});
	},
	_isBannedUser(data){
		var res = false;
		this.state.bannedUsers.forEach(function (user) {
			if (user.name === name) {
				res = true;
				return;
			}
		});
		return res;
	},
	_userJoined(data) {
		if (this.user && this._isBannedUser(data.user.name)) return;

		this._update(false, (res)=> {
			var {messages} = this.state;

			messages.push({
				user: data.user.name,
				text: 'Присоеденился к чату'
			});

			this.setState({messages});
		});
	},
	_userLeft(data) {
		if (!this.state.user && this._isBannedUser(data.user.name)) return;
		this._update(false, (res)=> {

			var {messages} = this.state;

			messages.push({
				user: data.user.name,
				text: 'Покинул чат'
			});

			this.setState({messages});
		});

	},
	_getMessages(receiver){
		var data = {sender: this.state.user, receiver: receiver};
		Socket.io.emit('chat:messages', data, (res)=> {
			let {messages} = res;
			this.setState({messages});
		});
	},
	handleMessageSubmit(message) {
		var {messages} = this.state;
		var data = {
			user: message.user,
			text: message.text,
			receiver: this.props.params.receiver
		};
		messages.push(data);
		this.setState({messages});
		Socket.io.emit('send:message', {
			text: message.text,
			sender: this.state.user,
			receiver: this.props.params.receiver
		});
	},
	handleToggleBanUser(data) {
		data.receiver = this.props.params.receiver;
		Socket.io.emit('user:togglebanned', data, (res)=> {
			let {bannedUsers, users, messages} = res;
			this.setState({bannedUsers, users, messages});
		});
	},
	messageField(){
		return document.getElementById(this.state.messageFieldId);
	},
	updateMessageField(appeal){
		this.messageField().value = appeal;
	},

	getUserColor(name){
		var color = null;

		this.state.users.forEach(function (user) {
			if (user.name === name)color = user.color;
		});

		if (!color)
			this.state.bannedUsers.forEach(function (user) {
				if (user.name === name)color = user.color;
			});


		return color;
	},
	render () {
		return <section className="chat">
			<Aside
			  user={this.state.user}
			  users={this.state.users}
			  bannedUsers={this.state.bannedUsers}
			  handleToggleBanUser={this.handleToggleBanUser}
			  userColor={this.state.userColor}
			/>

			<MessageList
			  updateMessageField={this.updateMessageField}
			  messages={this.state.messages}
			  userColor={this.state.userColor}
			  chatColor={this.state.chatColor}
			  getUserColor={this.getUserColor}
			/>

			<MessageForm
			  userColor={this.state.userColor}
			  user={this.state.user}
			  onMessageSubmit={this.handleMessageSubmit}
			  messageFieldId={this.state.messageFieldId}
			/>
		</section>
	}
});


export default Chat;
