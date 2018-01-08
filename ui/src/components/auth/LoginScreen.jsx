import React, {Component} from 'react';
import {injectIntl} from 'react-intl';
import {connect} from 'react-redux'
import {Redirect} from 'react-router';
import queryString from 'query-string';
import {NonIdealState} from '@blueprintjs/core';

import messages from 'src/content/messages';
import {loginWithPassword, loginWithToken} from 'src/actions/sessionActions';
import OAuthLogin from './OAuthLogin';
import {PasswordAuthLogin} from './PasswordAuth';

class LoginScreen extends Component {
  onLogin(data) {
    this.props.loginWithPassword(data.email, data.password);
  }

  componentWillMount() {
    const parsedHash = queryString.parse(window.location.hash);
    if (parsedHash.token) {
      this.props.loginWithToken(parsedHash.token);
      window.location.hash = '';
    }
  }

  render() {
    const {metadata, intl, session} = this.props;
    const passwordLogin = metadata.auth.password_login_uri;
    const oauthLogin = metadata.auth.oauth_uri;
    const hasLogin = passwordLogin || oauthLogin;

    if (session.loggedIn) {
      return <Redirect to="/" />
    }

    return <section className="small-screen">
        {hasLogin && <h2>Sign in</h2>}

        {passwordLogin && <PasswordAuthLogin onSubmit={this.onLogin.bind(this)}/>}
        {oauthLogin && <OAuthLogin provider={metadata.auth.oauth_uri}/>}

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
