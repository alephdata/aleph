import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Redirect} from 'react-router';
import {injectIntl} from 'react-intl';

import {endpoint} from '../api';
import {login} from '../actions/sessionActions';

import PasswordSignup from '../components/PasswordSignup';
import {xhrErrorToast, xhrSuccessToast} from '../components/XhrToast';

class SignupScreen extends Component {
  elements = {};

  submit(data) {
    const {match: {params}, intl, metadata, login} = this.props;

    endpoint.post('/roles', {code: params.code, ...data}).then((res) => {
      xhrSuccessToast(res, intl);
      endpoint.post(metadata.auth.password_login_uri, data).then((res) => {
        login(res.data.token);
      }).catch(e => {
        console.error("automatic login after signup failed", e);
      });
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
        <h2>Complete sign up</h2>
        <PasswordSignup onSignup={data => this.submit(data)} showFull/>
      </section>
    );
  }
}

const mapStateToProps = ({session, metadata}) => ({session, metadata});

SignupScreen = connect(
  mapStateToProps,
  {login}
)(injectIntl(SignupScreen));

export default SignupScreen;
