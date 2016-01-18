'use strict';
import React from 'react'
import ReactDOM from 'react-dom'

import Chat from './components/chat';
import LoginForm from './components/login';
import Auth from './components/auth';
import { createHistory, useBasename } from 'history'
import { Router, Route, Link, History, IndexRoute, Redirect } from 'react-router'


const history = useBasename(createHistory)({
	basename: '/'
});

function requireAuth (nextState, replaceState) {
	if (!Auth.loggedIn())
		replaceState({nextPathname: nextState.location.pathname}, '/login')
}

const App = React.createClass({
	getInitialState() {
		return {
			user: Auth.getUser()
		}
	},
	componentWillMount() {
		Auth.login();
	},

	render() {
		return (
		  <div className="contactor">

			  {this.props.children }
		  </div>
		)
	}
});

ReactDOM.render((
  <Router history={history}>
	  <Route path="/" component={App}>
		  <IndexRoute component={Chat} onEnter={requireAuth}/>
		  <Route path="/chat" component={Chat} onEnter={requireAuth}>
			  <Route path=":receiver" component={Chat}/>
		  </Route>

		  <Route path="login" component={LoginForm}/>

	  </Route>
  </Router>
), document.getElementById('app'));

