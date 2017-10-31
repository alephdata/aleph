import React from 'react';
import {FormattedMessage, injectIntl} from 'react-intl';
import {Link} from 'react-router-dom';
import {Button, Intent} from '@blueprintjs/core';

import {endpoint} from '../api';
import messages from "../messages";

import {xhrErrorToast} from "./XhrToast";

const PasswordLogin = ({onLogin, intl}) => {
  let emailElement, passwordElement;

  const login = function (event) {
    event.preventDefault();

    const data = {
      email: emailElement.value,
      password: passwordElement.value
    };

    endpoint.post('/sessions/login', data).then(res => {
      onLogin(res.data.token);
    }).catch(e => {
      xhrErrorToast(e.response, intl, {
        401: messages.status.wrong_credentials
      });
    });
  };

  return (
    <form onSubmit={login} className="pt-card">
      <label className="pt-label">
        <FormattedMessage id="login.email" defaultMessage="Email address"/>
        <input className="pt-input pt-fill" type="email" name="email" required ref={(el) => emailElement = el}/>
      </label>
      <label className="pt-label">
        <FormattedMessage id="login.password" defaultMessage="Password"/>
        <input className="pt-input pt-fill" type="password" name="password" required ref={(el) => passwordElement = el}/>
      </label>
      <div className="flex-row">
        <span>
          <Button className="pt-large" intent={Intent.PRIMARY} type="submit">
            <FormattedMessage id="login.submit" defaultMessage="Sign in"/>
          </Button>
        </span>
        <span>
          <FormattedMessage id="login.no_account" defaultMessage="Haven't got an account?" />{' '}
          <Link to="/invite"><FormattedMessage id="login.signup" defaultMessage="Sign up"/></Link>
        </span>
      </div>
    </form>
  );
};

export default injectIntl(PasswordLogin);
