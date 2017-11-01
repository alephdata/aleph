import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Redirect} from 'react-router';
import {injectIntl, FormattedMessage} from 'react-intl';

import {endpoint} from '../api';
import {loginWithPassword} from '../actions/sessionActions';

import {PasswordAuthActivate} from '../components/PasswordAuth';
import {xhrErrorToast} from '../components/XhrToast';

class ActivateScreen extends Component {
  onActivate(data) {
    const {match: {params}, intl, loginWithPassword} = this.props;

    endpoint.post('/roles', {code: params.code, ...data}).then((res) => {
      return loginWithPassword(res.data.email, data.password);
    }).catch(e => {
      console.log(e);
      xhrErrorToast(e.response, intl);
    });
  }

  render() {
    const {match: {params}, session} = this.props;

    if (!params.code) {
      return <Redirect to="/signup"/>;
    }

    if (session.loggedIn) {
      return <Redirect to="/"/>;
    }

    return (
      <section className="small-screen">
        <h2><FormattedMessage id="signup.title" defaultMessage="Activate your account"/></h2>
        <PasswordAuthActivate onSubmit={this.onActivate.bind(this)}/>
      </section>
    );
  }
}

const mapStateToProps = ({session}) => ({session});

ActivateScreen = connect(
  mapStateToProps,
  {loginWithPassword}
)(injectIntl(ActivateScreen));

export default ActivateScreen;
