import React from 'react';
import {FormattedMessage} from 'react-intl';
import {withRouter} from 'react-router-dom'
import {getProviderLoginUrl} from "../utils/utils";

const AuthButton = ({session, history}) => {
  if (session.logged_in) {
    const logout = function () {
      window.location.href = session.logout;
    };
    return <button className="pt-button pt-minimal pt-icon-user" onClick={logout}>
      <FormattedMessage id="nav.logoff" defaultMessage="Logout"/>
    </button>;
  } else {
    const login = function () {
      const providers = session.providers;
      if (providers.length === 1 && providers[0].name !== 'password') {
        window.location.href = getProviderLoginUrl(providers[0]);
      } else {
        history.push("/login");
      }
    };
    return <button className="pt-button pt-minimal pt-icon-user" onClick={login}>
      <FormattedMessage id="nav.login" defaultMessage="Login"/>
    </button>
  }
};

export default withRouter(AuthButton);
