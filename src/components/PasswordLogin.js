import React from 'react';
import {FormattedMessage, injectIntl} from 'react-intl';
import {Button, Intent} from '@blueprintjs/core';
import axios from 'axios';
import messages from "../messages";
import {xhrErrorToast} from "./XhrToast";

const PasswordLogin = ({authMetadata, onLogin, intl}) => {
  let emailElement, passwordElement;

  const login = function (event) {
    event.preventDefault();

    const url = authMetadata.password_login_uri;
    const data = {
      email: emailElement.value,
      password: passwordElement.value
    };

    axios.post(url, data).then((res) => {
      onLogin(res.data.token);
    }).catch(e => {
      xhrErrorToast(e.response, intl, {
        401: messages.status.wrong_credentials
      });
    });
  };

  return <form onSubmit={(e) => login(e)}>
    <label className="pt-label">
      <FormattedMessage id="login.email" defaultMessage="E-Mail address"/>
      <input className="pt-input" type="email" name="email" required ref={(el) => emailElement = el}/>
    </label>
    <label className="pt-label">
      <FormattedMessage id="login.password" defaultMessage="Password"/>
      <input className="pt-input" type="password" name="password" required ref={(el) => passwordElement = el}/>
    </label>
    <Button iconName="log-in" intent={Intent.PRIMARY} type="submit">
      <FormattedMessage id="login.submit" defaultMessage="Log in"/>
    </Button>
  </form>
};

export default injectIntl(PasswordLogin);
