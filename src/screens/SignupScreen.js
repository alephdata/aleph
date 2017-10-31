import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Redirect} from 'react-router';
import {injectIntl, FormattedMessage} from 'react-intl';

import {endpoint} from '../api';
import {loginWithPassword} from '../actions/sessionActions';

import {PasswordSignup} from '../components/PasswordAuthLogin';
import {xhrErrorToast} from '../components/XhrToast';

class SignupScreen extends Component {
  onSignup(data) {
    const {match: {params}, intl, loginWithPassword} = this.props;

    endpoint.post('/roles', {code: params.code, ...data}).then((res) => {
      return loginWithPassword(data.email, data.password);
    }).catch(e => {
      console.log(e);
      xhrErrorToast(e.response, intl);
    });
  }

  render() {
    const {match: {params}, session} = this.props;

    if (!params.code) {
      return <Redirect to="/invite"/>;
    }

    if (session.loggedIn) {
      return <Redirect to="/"/>;
    }

    return (
      <section className="small-screen">
        <h2><FormattedMessage id="signup.title" defaultMessage="Activate your account"/></h2>
        <PasswordSignup onSignup={this.onSignup.bind(this)} showFull/>
      </section>
    );
  }
}

const mapStateToProps = ({session}) => ({session});

SignupScreen = connect(
  mapStateToProps,
  {loginWithPassword}
)(injectIntl(SignupScreen));

export default SignupScreen;
