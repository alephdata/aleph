import React, {Component} from 'react';
import {FormattedMessage, injectIntl} from 'react-intl';
import {connect} from 'react-redux';
import {Redirect} from 'react-router';
import {NonIdealState} from '@blueprintjs/core';

import messages from '../messages';
import {endpoint} from '../api';

import Callout from '../components/Callout';
import OAuthLogin from '../components/OAuthLogin';
import {PasswordAuthSignup} from '../components/PasswordAuth';
import {xhrErrorToast} from '../components/XhrToast';

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

    if (!metadata.auth.registration) {
      return (
        <NonIdealState visual=""
          title={intl.formatMessage(messages.signup.not_available.title)}
          description={intl.formatMessage(messages.signup.not_available.desc)}/>
      );
    }

    if (submitted) {
      return <Callout modifier="primary"
                      title={intl.formatMessage(messages.signup.submitted.title)}
                      desc={intl.formatMessage(messages.signup.submitted.desc)}/>
    }

    return (
      <section className="small-screen">
        <h2><FormattedMessage id="signup.signup" defaultMessage="Sign up"/></h2>
        <PasswordAuthSignup onSubmit={this.onSignup.bind(this)} />
        {oauthLogin && <OAuthLogin providers={metadata.auth.oauth}/>}
      </section>
    );
  }
}

const mapStateToProps = ({session, metadata}) => ({session, metadata});

export default connect(mapStateToProps)(injectIntl(SignupScreen));
