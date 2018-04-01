import React, {Component} from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import {connect} from 'react-redux';
import {Redirect} from 'react-router';
import {Callout, Intent, Dialog} from '@blueprintjs/core';

import ErrorScreen from 'src/components/ErrorMessages/ErrorScreen';
import { endpoint } from 'src/app/api';
import { xhrErrorToast } from 'src/components/auth/xhrToast';
import OAuthLogin from 'src/components/auth/OAuthLogin';
import {PasswordAuthLogin} from 'src/components/auth/PasswordAuth';
import {PasswordAuthSignup} from 'src/components/auth/PasswordAuth';
import queryString from "query-string";
import {loginWithPassword, loginWithToken} from "src/actions/sessionActions";

import './style.css';

const messages = defineMessages({
  registration_not_available_title: {
    id: 'signup.not_available_title',
    defaultMessage: 'Registration is disabled'
  },
  title: {
    id: 'signup.title',
    defaultMessage: 'Sign in / Register',
  },
  registration_not_available_desc: {
    id: 'signup.not_available_desc',
    defaultMessage: 'Please contact the site admin to get an account'
  },
  not_available_title: {
    id: 'login.not_available_title',
    defaultMessage: 'Login is disabled',
  },
  not_available_desc: {
    id: 'login.not_available_desc',
    defaultMessage: 'There is no login provider configured for this app',
  }
});

class AuthenticationDialog extends Component {
  constructor() {
    super();

    this.state = {
      submitted: false,
    };
  }

  componentWillMount() {
    const parsedHash = queryString.parse(window.location.hash);
    if (parsedHash.token) {
      this.props.loginWithToken(parsedHash.token);
      window.location.hash = '';
    }
  }

  onSignup(data) {
    endpoint.post('/roles/code', data).then(() => {
      this.setState({submitted: true})
    }).catch(e => {
      console.log(e);
      xhrErrorToast(e.response, this.props.intl);
    });
  }

  onLogin(data) {
    this.props.loginWithPassword(data.email, data.password);
  }

  render() {
    const {submitted} = this.state;
    const {metadata, session, intl} = this.props;
    const passwordLogin = metadata.auth.password_login_uri;
    const oauthLogin = Array.isArray(metadata.auth.oauth) && metadata.auth.oauth.length > 0;
    const hasLogin = passwordLogin || oauthLogin;

    if (session.loggedIn) {
      return <Redirect to="/"/>;
    }

    if (!metadata.auth.registration_uri) {
      return (
        <ErrorScreen.PageNotFound visual='' title={messages.registration_not_available_title} description={messages.registration_not_available_desc}/>
      );
    }

    if (!passwordLogin && oauthLogin) {
      window.location.replace(oauthLogin);
      return null;
    }

    return (
      <Dialog icon="authentication" className="AuthenticationScreen" backdropClassName='test-class'
              isOpen={this.props.isOpen}
              onClose={this.props.toggleDialog}
              title={intl.formatMessage(messages.title)}>
        <div className="auth-dialog-body">
          <section className="auth-screen">
            {hasLogin && <h1>Sign in</h1>}
            {passwordLogin && <PasswordAuthLogin onSubmit={this.onLogin.bind(this)}/>}
            {oauthLogin && <OAuthLogin provider={metadata.auth.oauth_uri}/>}
            {!hasLogin &&
            <ErrorScreen.PageNotFound visual='log-in' title={messages.not_available_title} description={messages.not_available_desc}/>}
          </section>
          <section className="auth-screen">
            <h1><FormattedMessage id="signup.signup" defaultMessage="Register"/></h1>
            {submitted ?
              <Callout intent={Intent.SUCCESS} icon="tick">
                <h5><FormattedMessage id="signup.inbox.title" defaultMessage="Check your inbox"/></h5>
                <FormattedMessage id="signup.inbox.desc" defaultMessage="We've sent you an email, please follow the link to complete your registration"/>
              </Callout> :
              <span>
            <PasswordAuthSignup onSubmit={this.onSignup.bind(this)}/>
                {oauthLogin && <OAuthLogin providers={metadata.auth.oauth}/>}
          </span>}
          </section>
        </div>
      </Dialog>
    );
  }
}

const mapStateToProps = ({session, metadata}) => ({session, metadata});

export default connect(mapStateToProps, {loginWithToken, loginWithPassword})(injectIntl(AuthenticationDialog));
