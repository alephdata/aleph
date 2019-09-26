import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import {
  Callout, Intent, Dialog, MenuDivider, Button,
} from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { endpoint } from 'src/app/api';
import { showResponseToast } from 'src/app/toast';
import { PasswordAuthLogin, PasswordAuthSignup } from 'src/components/auth/PasswordAuth';
import {
  loginWithPassword as loginWithPasswordAction,
  loginWithToken as loginWithTokenAction,
} from 'src/actions/sessionActions';
import { selectMetadata } from 'src/selectors';

import './AuthenticationDialog.scss';

const messages = defineMessages({
  title: {
    id: 'signup.title',
    defaultMessage: 'Sign in',
  },
  registration_title: {
    id: 'signup.register',
    defaultMessage: 'Register',
  },
});

export class AuthenticationDialog extends Component {
  constructor(props) {
    super(props);

    this.state = {
      submitted: false,
      firstSection: '',
      secondSection: 'hide',
    };

    this.onLogin = this.onLogin.bind(this);
    this.onSignup = this.onSignup.bind(this);
    this.onRegisterClick = this.onRegisterClick.bind(this);
    this.onSignInClick = this.onSignInClick.bind(this);
    this.onOAuthLogin = this.onOAuthLogin.bind(this);
  }

  onOAuthLogin() {
    const { nextPath, metadata: { auth } } = this.props;
    if (auth.oauth_uri) {
      const nextPathEnc = encodeURIComponent(nextPath || '/');
      window.location.replace(`/api/2/sessions/oauth?next=${nextPathEnc}`);
    }
  }

  onSignup(data) {
    const { intl } = this.props;
    endpoint.post('/roles/code', data).then(() => {
      this.setState({ submitted: true });
    }).catch((e) => {
      showResponseToast(e.response, intl);
    });
  }

  async onLogin(data) {
    const { nextPath, intl, loginWithPassword } = this.props;
    try {
      await loginWithPassword(data.email, data.password);
      window.location.replace(nextPath || '/');
    } catch (e) {
      showResponseToast(e.response, intl);
    }
  }

  onRegisterClick(e) {
    e.preventDefault();
    this.setState({ firstSection: 'hide', secondSection: '' });
  }

  onSignInClick(e) {
    e.preventDefault();
    this.setState({ firstSection: '', secondSection: 'hide' });
  }

  render() {
    const {
      metadata, intl, isOpen, toggleDialog,
    } = this.props;
    const { auth } = metadata;
    const { submitted, firstSection, secondSection } = this.state;
    const passwordLogin = auth.password_login_uri;

    if (!isOpen) {
      return null;
    }

    if (!auth.password_login_uri) {
      this.onOAuthLogin();
      return null;
    }

    return (
      <Dialog
        icon="authentication"
        className="AuthenticationScreen"
        isOpen={isOpen}
        onClose={toggleDialog}
        title={firstSection === '' ? intl.formatMessage(messages.title) : intl.formatMessage(messages.registration_title)}
      >
        <div className="inner">
          <section className={firstSection}>
            {passwordLogin && <PasswordAuthLogin buttonClassName="signin-button" onSubmit={this.onLogin} />}
            {passwordLogin && (
            <div className="link-box">
              <a key="oauth" href="/" onClick={this.onRegisterClick}>
                <FormattedMessage
                  id="signup.register.question"
                  defaultMessage="Don't have account? Register!"
                />
              </a>
            </div>
            )}
          </section>
          <section className={secondSection}>
            {submitted
              ? (
                <Callout intent={Intent.SUCCESS} icon="tick">
                  <h5><FormattedMessage id="signup.inbox.title" defaultMessage="Check your inbox" /></h5>
                  <FormattedMessage
                    id="signup.inbox.desc"
                    defaultMessage="We've sent you an email, please follow the link to complete your registration"
                  />
                </Callout>
              )
              : (
                <span>
                  <PasswordAuthSignup buttonClassName="signin-button" onSubmit={this.onSignup} />
                  <div className="link-box">
                    <a key="oauth" href="/" onClick={this.onSignInClick}>
                      <FormattedMessage
                        id="signup.login"
                        defaultMessage="Already have account? Sign in!"
                      />
                    </a>
                  </div>
                </span>
              )}
          </section>
          {auth.oauth_uri && (
            <React.Fragment>
              <MenuDivider className="menu-divider" />
              <Button icon="log-in" large fill onClick={this.onOAuthLogin}>
                <FormattedMessage id="login.oauth" defaultMessage="Sign in via OAuth" />
              </Button>
            </React.Fragment>
          )}
        </div>
      </Dialog>
    );
  }
}
const mapStateToProps = state => ({ metadata: selectMetadata(state) });
const mapDispatchToProps = {
  loginWithToken: loginWithTokenAction, loginWithPassword: loginWithPasswordAction,
};
export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(AuthenticationDialog);
