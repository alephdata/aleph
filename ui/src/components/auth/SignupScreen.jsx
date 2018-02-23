import React, {Component} from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import {connect} from 'react-redux';
import {Redirect} from 'react-router';
import {Callout, Intent, NonIdealState} from '@blueprintjs/core';

import {endpoint} from 'src/app/api';
import {xhrErrorToast} from './xhrToast';
import OAuthLogin from './OAuthLogin';
import {PasswordAuthSignup} from './PasswordAuth';

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
    const {metadata, intl, session} = this.props;

    const oauthLogin = Array.isArray(metadata.auth.oauth) && metadata.auth.oauth.length > 0;

    if (session.loggedIn) {
      return <Redirect to="/"/>;
    }

    if (!metadata.auth.registration_uri) {
      return (
        <NonIdealState visual=""
          title={intl.formatMessage(messages.not_available_title)}
          description={intl.formatMessage(messages.not_available_desc)}/>
      );
    }

    return (
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
    );
  }
}

const mapStateToProps = ({session, metadata}) => ({session, metadata});

export default connect(mapStateToProps)(injectIntl(SignupScreen));
