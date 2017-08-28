import React from 'react';
import {FormattedMessage} from 'react-intl';
import AuthButton from "./AuthButton";
import {Link} from "react-router-dom";

const SignupButton = () => <Link to="/invite">
  <button className="pt-button pt-minimal pt-icon-user">
    <FormattedMessage id="nav.signup" defaultMessage="Sign Up"/>
  </button>
</Link>;

const PageNavbar = ({metadata, session}) => (
  <nav className="pt-navbar pt-dark">
    <div className="pt-navbar-group pt-align-left">
      <div className="pt-navbar-heading">
        {metadata.app.title}
      </div>
      <button className="pt-button pt-minimal pt-icon-home">
        <FormattedMessage id="nav.home" defaultMessage="Home"/>
      </button>
      <button className="pt-button pt-minimal pt-icon-document">
        <FormattedMessage id="nav.documents" defaultMessage="Documents"/>
      </button>
    </div>
    <div className="pt-navbar-group pt-align-right">
      {session.loggedIn && <button className="pt-button pt-minimal pt-icon-cog"/>}
      {session.loggedIn && <button className="pt-button pt-minimal pt-icon-notifications"/>}
      <AuthButton session={session}/>
      {!session.loggedIn && metadata.auth.registration && <SignupButton/>}
    </div>
  </nav>
);

export default PageNavbar;
