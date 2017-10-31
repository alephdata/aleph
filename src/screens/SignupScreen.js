import React, {Component} from 'react';
import {Redirect, withRouter} from "react-router";
import {FormattedMessage, injectIntl} from "react-intl";
import {Button, Intent} from '@blueprintjs/core';
import {endpoint} from "../api";
import {xhrErrorToast, xhrSuccessToast} from "../components/XhrToast";
import {connect} from "react-redux";
import {login} from "../actions/sessionActions";
import mapValues from 'lodash/mapValues';

class SignupScreen extends Component {
  elements = {};

  submit(event) {
    const {match: {params}, intl, metadata, login} = this.props;
    event.preventDefault();

    const data = {code: params.code, ...mapValues(this.elements, 'value')};

    endpoint.post('/roles', data).then((res) => {
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

    return <section>
      <form onSubmit={(e) => this.submit(e)}>
        <label className="pt-label">
          <FormattedMessage id="signup.email" defaultMessage="E-Mail address"/>
          <input className="pt-input" type="email" name="email" required ref={(el) => this.elements["email"] = el}/>
        </label>
        <label className="pt-label">
          <FormattedMessage id="signup.name" defaultMessage="Your Name"/>
          <input className="pt-input" type="text" name="name" required ref={(el) => this.elements["name"] = el}/>
        </label>
        <label className="pt-label">
          <FormattedMessage id="signup.password" defaultMessage="Password"/>
          <input className="pt-input" type="password" name="password" required
                 ref={(el) => this.elements["password"] = el}/>
        </label>
        <Button iconName="log-in" intent={Intent.PRIMARY} type="submit">
          <FormattedMessage id="signup.submit" defaultMessage="Signup"/>
        </Button>
      </form>
    </section>
  }
}

const mapStateToProps = ({session, metadata}) => ({session, metadata});

SignupScreen = connect(
  mapStateToProps,
  {login}
)(withRouter(injectIntl(SignupScreen)));

export default SignupScreen;
