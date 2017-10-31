import React, {Component} from 'react';
import {FormattedMessage, injectIntl} from 'react-intl';
import {connect} from 'react-redux';
import {Redirect} from 'react-router';
import {NonIdealState} from '@blueprintjs/core';

import messages from '../messages';
import {endpoint} from '../api';

import Callout from '../components/Callout';
import OAuthLogin from '../components/OAuthLogin';
import PasswordSignup from '../components/PasswordSignup';
import {xhrErrorToast} from '../components/XhrToast';

class InviteScreen extends Component {
  state = {submitted: false};

  submit(data) {
    endpoint.post('/roles/invite', data).then(() => {
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
          title={intl.formatMessage(messages.invite.not_available.title)}
          description={intl.formatMessage(messages.invite.not_available.desc)}/>
      );
    }

    if (submitted) {
      return <Callout modifier="primary"
                      title={intl.formatMessage(messages.invite.submitted.title)}
                      desc={intl.formatMessage(messages.invite.submitted.desc)}/>
    }

    return (
      <section className="small-screen">
        <h2><FormattedMessage id="invite.signup" defaultMessage="Sign up"/></h2>
        <PasswordSignup onSignup={this.submit} />
        {oauthLogin && <OAuthLogin providers={metadata.auth.oauth}/>}
      </section>
    );
  }
}

const mapStateToProps = ({session, metadata}) => ({session, metadata});

export default connect(mapStateToProps)(injectIntl(InviteScreen));
