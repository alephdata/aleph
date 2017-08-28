import React, {Component} from 'react';
import {connect} from 'react-redux'
import PasswordLogin from "../components/PasswordLogin";
import OAuthLogin, {handleOAuthCallback} from "../components/OAuthLogin";
import Callout from "../components/Callout";
import {login} from "../actions/sessionActions";
import {withRouter} from "react-router";
import {showErrorToast, showSuccessToast} from "../components/Toast";
import messages from "../messages";
import {injectIntl} from "react-intl";

class LoginScreen extends Component {
  login(token) {
    const {dispatch, intl} = this.props;
    try {
      dispatch(login(token));
      showSuccessToast(intl.formatMessage(messages.status.success));
    } catch (e) {
      console.error("invalid login token", e);
      showErrorToast(intl.formatMessage(messages.status.unknown_error))
    }
  }

  componentWillMount() {
    handleOAuthCallback((token) => this.login(token));
  }

  componentWillReceiveProps(nextProps) {
    const {session, history} = nextProps;
    if (session.loggedIn) {
      history.push('/');
    }
  }

  render() {
    const {metadata} = this.props;
    const passwordLogin = metadata.auth.password_login;
    const oauthLogin = Array.isArray(metadata.auth.oauth) && metadata.auth.oauth.length > 0;

    if (!passwordLogin && !oauthLogin) return <Callout modifier="warning" title="login.unavailable.title"
                                                       desc="login.unavailable.desc"/>;

    return <section>
      {passwordLogin && <PasswordLogin authMetadata={metadata.auth} onLogin={(token) => this.login(token)}/>}

      <hr/>

      {oauthLogin && <OAuthLogin providers={metadata.auth.oauth} onLogin={(token) => this.login(token)}/>}
    </section>
  }
}

const mapStateToProps = (state) => ({session: state.session, metadata: state.metadata});
export default connect(mapStateToProps)(withRouter(injectIntl(LoginScreen)));
