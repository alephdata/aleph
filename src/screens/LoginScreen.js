import React, {Component} from 'react';
import {injectIntl} from 'react-intl';
import {connect} from 'react-redux'
import {Redirect} from 'react-router';
import {NonIdealState} from '@blueprintjs/core';

import messages from '../messages';
import {login} from '../actions/sessionActions';

import OAuthLogin, {handleOAuthCallback} from '../components/OAuthLogin';
import PasswordLogin from '../components/PasswordLogin';
import {showErrorToast, showSuccessToast} from '../components/Toast';

class LoginScreen extends Component {
  constructor() {
    super();
    this.login = this.login.bind(this);
  }

  login(token) {
    const {intl, login} = this.props;
    try {
      login(token);
      showSuccessToast(intl.formatMessage(messages.status.success));
    } catch (e) {
      console.error('Invalid login token', e);
      showErrorToast(intl.formatMessage(messages.status.unknown_error))
    }
  }

  componentWillMount() {
    handleOAuthCallback(this.login);
  }

  render() {
    const {metadata, intl, session} = this.props;
    const passwordLogin = metadata.auth.password_login;
    const oauthLogin = Array.isArray(metadata.auth.oauth) && metadata.auth.oauth.length > 0;

    const hasLogin = passwordLogin || oauthLogin;

    return session.loggedIn ?
      <Redirect to="/"/> :
      <section className="small-screen">
        {hasLogin && <h2>Sign in</h2>}

        {passwordLogin && <PasswordLogin onLogin={this.login}/>}
        {oauthLogin && <OAuthLogin providers={metadata.auth.oauth} onLogin={this.login}/>}

        {!hasLogin &&
          <NonIdealState visual="log-in"
            title={intl.formatMessage(messages.login.not_available.title)}
            description={intl.formatMessage(messages.login.not_available.desc)}/>}
      </section>
  }
}

const mapStateToProps = ({session, metadata}) => ({session, metadata});

LoginScreen = connect(
  mapStateToProps,
  {login}
)(injectIntl(LoginScreen));

export default LoginScreen;
