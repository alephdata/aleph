import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Redirect} from 'react-router';
import {injectIntl, FormattedMessage} from 'react-intl';

import Screen from 'src/components/common/Screen';
import { endpoint } from 'src/app/api';
import { loginWithPassword } from 'src/actions/sessionActions';
import { xhrErrorToast } from 'src/components/auth/xhrToast';
import { PasswordAuthActivate } from 'src/components/auth/PasswordAuth';


class ActivateScreen extends Component {
  onActivate(data) {
    const {match: {params}, intl, loginWithPassword} = this.props;

    endpoint.post('/roles', {code: params.code, ...data}).then((res) => {
      return loginWithPassword(res.data.email, data.password);
    }).catch(e => {
      xhrErrorToast(e.response, intl);
    });
  }

  render() {
    const {match: {params}, session, intl} = this.props;

    if (!params.code || session.loggedIn) {
      return <Redirect to="/"/>;
    }

    return (
      <Screen>
        <div className="small-screen-outer">
          <div className="small-screen-inner">
            <section className="small-screen">
              <h1><FormattedMessage id="signup.title" defaultMessage="Activate your account"/></h1>
              <PasswordAuthActivate onSubmit={this.onActivate.bind(this)} intl={intl}/>
            </section>
          </div>
        </div>
      </Screen>
    );
  }
}

const mapStateToProps = ({session}) => ({session});

ActivateScreen = connect(
  mapStateToProps,
  {loginWithPassword}
)(injectIntl(ActivateScreen));

export default ActivateScreen;
