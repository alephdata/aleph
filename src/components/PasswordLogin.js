import React from 'react';
import {FormattedMessage} from 'react-intl';
import {endpoint} from '../api';

const PasswordLogin = ({authMetadata}) => {
  let emailElement, passwordElement;

  const login = function (event) {
    event.preventDefault();

    const url = authMetadata.password_login_uri;
    const data = {
      email: emailElement.value,
      password: passwordElement.value
    };

    endpoint.post(url, data).then((res) => {
      console.log(res); // TODO
    }).catch(e => {
      console.error(e); // TODO
    });
  };

  return <form onSubmit={(e) => login(e)}>
    <label className="pt-label">
      <FormattedMessage id="login.email" defaultMessage="E-Mail address"/>
      <input className="pt-input" type="email" ref={(el) => emailElement = el}/>
    </label>
    <label className="pt-label">
      <FormattedMessage id="login.password" defaultMessage="Password"/>
      <input className="pt-input" type="password" ref={(el) => passwordElement = el}/>
    </label>
    <button type="submit" className="pt-button pt-intent-primary pt-icon-log-in">
      <FormattedMessage id="login.submit" defaultMessage="Log in"/>
    </button>
  </form>
};

export default PasswordLogin;
