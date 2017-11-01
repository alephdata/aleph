import React, {Component} from 'react';
import {injectIntl} from 'react-intl';
import {connect} from 'react-redux'
import {Redirect} from 'react-router';
import {NonIdealState} from '@blueprintjs/core';

import messages from '../messages';
import {loginWithPassword, loginWithToken} from '../actions/sessionActions';

import OAuthLogin, {handleOAuthCallback} from '../components/OAuthLogin';
import {PasswordAuthLogin} from '../components/PasswordAuth';

class LoginScreen extends Component {
  onLogin(data) {
    this.props.loginWithPassword(data.email, data.password);
  }

  componentWillMount() {
    handleOAuthCallback(this.props.loginWithToken);
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

        {passwordLogin && <PasswordAuthLogin onSubmit={this.onLogin.bind(this)}/>}
        {oauthLogin && <OAuthLogin providers={metadata.auth.oauth}/>}

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
  {loginWithToken, loginWithPassword}
)(injectIntl(LoginScreen));

export default LoginScreen;
