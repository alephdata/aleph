import React, {Component} from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import {connect} from 'react-redux';
import {Redirect} from 'react-router';
import {Callout, Intent} from '@blueprintjs/core';

import ErrorScreen from 'src/components/ErrorMessages/ErrorScreen';
import Screen from 'src/components/common/Screen';
import { endpoint } from 'src/app/api';
import { xhrErrorToast } from 'src/components/auth/xhrToast';
import OAuthLogin from 'src/components/auth/OAuthLogin';
import {PasswordAuthSignup} from 'src/components/auth/PasswordAuth';

const messages = defineMessages({
  not_available_title: {
    id: 'signup.not_available_title',
    defaultMessage: 'Registration is disabled'
  },
  not_available_desc: {
    id: 'signup.not_available_desc',
    defaultMessage: 'Please contact the site admin to get an account'
  }
});

class SignupScreen extends Component {
  state = {submitted: false};

  onSignup(data) {
    endpoint.post('/roles/code', data).then(() => {
      this.setState({submitted: true})
    }).catch(e => {
      console.log(e);
      xhrErrorToast(e.response, this.props.intl);
    });
  }

  render() {
    const {submitted} = this.state;
    const {metadata, session} = this.props;

    const oauthLogin = Array.isArray(metadata.auth.oauth) && metadata.auth.oauth.length > 0;

    if (session.loggedIn) {
      return <Redirect to="/"/>;
    }

    if (!metadata.auth.registration_uri) {
      return (
        <ErrorScreen.PageNotFound visual='' title={messages.not_available_title} description={messages.not_available_desc}/>
      );
    }

    return (
      <Screen>
        <div className="small-screen-outer">
          <div className="small-screen-inner">
            <section className="small-screen">
              <h1><FormattedMessage id="signup.signup" defaultMessage="Sign up"/></h1>
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
        </div>
      </Screen>
    );
  }
}

const mapStateToProps = ({session, metadata}) => ({session, metadata});

export default connect(mapStateToProps)(injectIntl(SignupScreen));
