import React from 'react';
import {FormattedMessage} from 'react-intl';
import {Link} from 'react-router-dom'

const AuthButton = ({session}) => {
  if (session.loggedIn) {
    return <Link to="/logout">
      <button className="pt-button pt-minimal pt-icon-user">
        <FormattedMessage id="nav.logoff" defaultMessage="Logout"/>
      </button>
    </Link>;
  } else {
    return <Link to="/login">
      <button className="pt-button pt-minimal pt-icon-user">
        <FormattedMessage id="nav.login" defaultMessage="Login"/>
      </button>
    </Link>
  }
};

export default AuthButton;
