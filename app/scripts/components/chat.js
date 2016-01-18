'use strict';
import {Link} from 'react-router'
import React from 'react'
import Auth from '../components/auth'
import Socket from '../components/socket'
import classNames from 'classnames'

var UsersListItem = React.createClass({
	handleClick: function (event) {
		this.props.handleToggleBanUser({user: this.props.name, banned: this.props.ban});
	},
	render(){
		var addBanClass = classNames({
			'hidden': (this.props.ban ? true : false)
		});
		var addListClass = classNames({
			'hidden': (this.props.ban ? false : true)
		});

		return (
		  <div>
			  <Link className="chat-userpick" to={this.props.url} activeClassName="active" onlyActiveOnIndex={true}>
				  <div className="userpick-badge">{this.props.badge}</div>
				  <div className="userpick-name">{this.props.name}</div>
			  </Link>
			  <button type="button" className={addBanClass} onClick={this.handleClick}>x</ button >
			  <button type="button" className={addListClass} onClick={this.handleClick}>+</ button >
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
				  <div className="chat-userpick">
					  <div className="userpick-badge">2</div>
					  <div className="userpick-name">{this.props.user}</div>
				  </div>
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
									  badge={i}
									  handleToggleBanUser={this.props.handleToggleBanUser}
									  url={`/chat/${user.name}`}
									/>
								</li>
							  );
						  }
					  })
				  }
			  </ul>

			  <div className={banListClass}>
				  <div>Исключения</div>
				  <ul className="ban-list">
					  {
						  this.props.bannedUsers.map((user, i) => {
							  return (
								<li key={i}>
									<UsersListItem
									  name={user.name}
									  badge={i}
									  url={`/chat/${user.name}`}
									  handleToggleBanUser={this.props.handleToggleBanUser}
									  ban="true"
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
		this.props.updateMessageField([this.props.user, ','].join());
	},
	render() {
		return (
		  <li>
			  <label className="sadasd" htmlFor="message-field" onClick={this.addToField}>
				  <strong>{this.props.user} :</strong>
				  <span>{this.props.text}</span>
			  </label>
		  </li>
		);
	}
});

var MessageList = React.createClass({
	render() {
		return (
		  <ul className="chat-messages">
			  {
				  this.props.messages.map((message, i) => {
					  return (
						<Message
						  key={i}
						  user={message.user}
						  text={message.text}
						  updateMessageField={this.props.updateMessageField}
						/>
					  );
				  })
			  }
		  </ul>
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
		  <article className="chat-form">
			  <form onSubmit={this.handleSubmit}>
				  <input
					id={this.props.messageFieldId}
					onChange={this.changeHandler}
					className='form-control'
					value={this.state.text}
					autoComplete="off"
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
			messageFieldId: 'message-field'
		};
	},

	componentDidMount() {
		var data = {user: this.state.user, receiver: this.props.params.receiver};
		Socket.io.emit('chat:init', data, (res)=> {
			let {users, messages, bannedUsers} = res;
			this.setState({users, messages, bannedUsers});
		});

		Socket.io.on('send:message', this._messageRecieve);
		Socket.io.on('user:join', this._userJoined);
		Socket.io.on('user:left', this._userLeft);

	},
	componentWillUnmount(){
		Socket.io.off('send:message');
		Socket.io.off('user:join');
		Socket.io.off('user:left');
	},
	componentWillReceiveProps: function (nextProps) {
		this._getMessages(nextProps.params.receiver);
	},
	_messageRecieve(message) {
		var {messages} = this.state;
		messages.push(message);
		this.setState({messages});
	},
	_isBannedUser(user){
		if (this.state.bannedUsers.indexOf(user) === -1) {
			return false;
		} else {
			return true;
		}
	},
	_userJoined(data) {
		var {users, messages} = this.state;
		var {user} = data;

		if (this._isBannedUser(user)) return;

		messages.push({
			user: 'APPLICATION BOT',
			text: user + ' Joined'
		});
		this.setState({users, messages});
	},
	_userLeft(data) {
		if (!this.state.user) return;

		var {users, messages} = this.state;
		var {user} = data;

		if (this._isBannedUser(user)) return;

		messages.push({
			user: 'APPLICATION BOT',
			text: user + ' Left'
		});
		this.setState({users, messages});
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
		messages.push(message);
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

	addMessageField(){

	},
	render () {
		return <section className="chat">
			<Aside
			  user={this.state.user}
			  users={this.state.users}
			  bannedUsers={this.state.bannedUsers}
			  handleToggleBanUser={this.handleToggleBanUser}
			/>

			<MessageList
			  updateMessageField={this.updateMessageField}
			  messages={this.state.messages}
			/>

			<MessageForm
			  user={this.state.user}
			  onMessageSubmit={this.handleMessageSubmit}
			  messageFieldId={this.state.messageFieldId}
			/>
		</section>
	}
});


export default Chat;
