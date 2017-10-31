import React, {Component} from 'react';
import {connect} from 'react-redux'
import PasswordLogin from "../components/PasswordLogin";
import OAuthLogin, {handleOAuthCallback} from "../components/OAuthLogin";
import Callout from "../components/Callout";
import {login} from "../actions/sessionActions";
import {Redirect, withRouter} from "react-router";
import {showErrorToast, showSuccessToast} from "../components/Toast";
import messages from "../messages";
import {injectIntl} from "react-intl";

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
      console.error("invalid login token", e);
      showErrorToast(intl.formatMessage(messages.status.unknown_error))
    }
  }

  componentWillMount() {
    handleOAuthCallback(this.login);
  }

  componentWillReceiveProps(nextProps) {
    const {session, history} = nextProps;
    if (session.loggedIn) {
      history.push('/');
    }
  }

  render() {
    const {metadata, intl, session} = this.props;
    const passwordLogin = metadata.auth.password_login;
    const oauthLogin = Array.isArray(metadata.auth.oauth) && metadata.auth.oauth.length > 0;

    if (session.loggedIn) {
      return <Redirect to="/"/>;
    }

    if (!passwordLogin && !oauthLogin) {
      return <Callout modifier="warning"
                      title={intl.formatMessage(messages.login.not_available.title)}
                      desc={intl.formatMessage(messages.login.not_available.desc)}/>;
    }

    return <section>
      {passwordLogin && <PasswordLogin authMetadata={metadata.auth} onLogin={this.login}/>}

      <hr/>

      {oauthLogin && <OAuthLogin providers={metadata.auth.oauth} onLogin={this.login}/>}
    </section>
  }
}

const mapStateToProps = (state) => ({session: state.session, metadata: state.metadata});

LoginScreen = connect(
  mapStateToProps,
  {login}
)(withRouter(injectIntl(LoginScreen)));

export default LoginScreen;
