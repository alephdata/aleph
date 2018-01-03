import React from 'react';
import {FormattedMessage} from 'react-intl';
import {Button} from '@blueprintjs/core';
import {Link} from 'react-router-dom';

import AuthButton from 'src/components/auth/AuthButton';
import PageNavbarSearchForm from './PageNavbarSearchForm';

const SignupButton = () => <Link to="/signup">
  <Button iconName="user" className="pt-minimal">
    <FormattedMessage id="nav.signup" defaultMessage="Sign up"/>
  </Button>
</Link>;

const PageNavbar = ({metadata, session}) => (
  <nav className="pt-navbar pt-dark">
    <div className="pt-navbar-group pt-align-left">
      <div className="pt-navbar-heading">
        <Link to="/">{ String.fromCharCode(8501) } {metadata.app.title}</Link>
      </div>
      <PageNavbarSearchForm />
    </div>
    <div className="pt-navbar-group pt-align-right">
      {session.loggedIn && <Button iconName="cog" className="pt-minimal"/>}
      {session.loggedIn && <Button iconName="notifications" className="pt-minimal"/>}
      <AuthButton session={session}/>
      {!session.loggedIn && metadata.auth.registration && <SignupButton/>}
    </div>
  </nav>
);

export default PageNavbar;
