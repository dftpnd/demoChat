'use strict';

import React from 'react'
import Auth from '../components/auth';
import {History } from 'react-router'


var LoginForm = React.createClass({
	mixins: [History],

	componentDidMount() {
		Auth.logout()
	},

	getInitialState() {
		return {newName: ''};
	},

	onKey(e) {
		this.setState({newName: e.target.value});
	},

	handleSubmit(e) {
		e.preventDefault();
		var user = this.state.newName;

		Auth.login(user, (loggedIn) => {
			const { location } = this.props;

			if (location.state && location.state.nextPathname) {
				this.history.replaceState(null, location.state.nextPathname)
			} else {
				this.history.replaceState(null, '/chat')
			}
		})

	},

	render() {
		return (
		  <article className="login-form">
			  <form onSubmit={this.handleSubmit}>
				  <div>
					  <input
						type="text"
						placeholder="Введите имя"
						onChange={this.onKey}
						value={this.state.newName}
						autoFocus
					  />
					  <button type="submit">Войти</button>
				  </div>
			  </form>
		  </article>
		);
	}
});


export default LoginForm;