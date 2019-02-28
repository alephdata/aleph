import React, { Component } from 'react';
import { Redirect } from 'react-router';
import { FormattedMessage } from 'react-intl';

import Screen from 'src/components/Screen/Screen';
import { endpoint } from 'src/app/api';
import { loginWithPassword } from 'src/actions/sessionActions';
import { xhrErrorToast } from 'src/components/auth/xhrToast';
import { PasswordAuthActivate } from 'src/components/auth/PasswordAuth';
import { translatableConnected } from '../OAuthScreen/enhancers';


export class ActivateScreen extends Component {
  constructor(props) {
    super(props);
    this.onActivate = this.onActivate.bind(this);
  }

  onActivate(data) {
    const { match: { params }, intl } = this.props;

    endpoint.post('/roles', { code: params.code, ...data })
      .then(res => this.props.loginWithPassword(res.data.email, data.password))
      .catch((e) => {
        xhrErrorToast(e.response, intl);
      });
  }

  render() {
    const { match: { params }, session, intl } = this.props;

    if (!params.code || session.loggedIn) {
      return <Redirect to="/" />;
    }

    return (
      <Screen>
        <div className="small-screen-outer">
          <div className="small-screen-inner">
            <section className="small-screen">
              <h1><FormattedMessage id="signup.title" defaultMessage="Activate your account" /></h1>
              <PasswordAuthActivate className="bp3-card" onSubmit={this.onActivate} intl={intl} />
            </section>
          </div>
        </div>
      </Screen>
    );
  }
}
const mapStateToProps = ({ session }) => ({ session });
const mapDispatchToProps = { loginWithPassword };
export default translatableConnected({
  mapStateToProps, mapDispatchToProps,
})(ActivateScreen);
