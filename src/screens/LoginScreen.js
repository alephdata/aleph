import React, {Component} from 'react';
import {connect} from 'react-redux'
import PasswordLogin from "../components/PasswordLogin";
import OAuthLogin from "../components/OAuthLogin";
import Callout from "../components/Callout";

class LoginScreen extends Component {
  render() {
    const {metadata} = this.props;
    const passwordLogin = metadata.auth.password_login;
    const oauthLogin = Array.isArray(metadata.auth.oauth) && metadata.auth.oauth.length > 0;

    if (!passwordLogin && !oauthLogin) return <Callout modifier="warning" title="login.unavailable.title"
                                                       desc="login.unavailable.desc"/>;

    return <section>
      {passwordLogin && <PasswordLogin authMetadata={metadata.auth}/>}

      <hr/>

      {oauthLogin && <OAuthLogin providers={metadata.auth.oauth}/>}
    </section>
  }
}

const mapStateToProps = (state) => ({session: state.session, metadata: state.metadata});
export default connect(mapStateToProps)(LoginScreen);
