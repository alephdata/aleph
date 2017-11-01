import React from 'react';
import {Button} from '@blueprintjs/core';
import {FormattedMessage} from 'react-intl';
import {Link} from 'react-router-dom'

const AuthButton = ({session}) => {
  if (session.loggedIn) {
    return <Link to="/logout">
      <Button iconName="user" className="pt-minimal">
        <FormattedMessage id="nav.signout" defaultMessage="Sign out"/>
      </Button>
    </Link>;
  } else {
    return <Link to="/login">
      <Button iconName="user" className="pt-minimal">
        <FormattedMessage id="nav.signin" defaultMessage="Sign in"/>
      </Button>
    </Link>
  }
};

export default AuthButton;
