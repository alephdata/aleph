import React from 'react';
import {FormattedMessage} from 'react-intl';
import AuthButton from "./AuthButton";

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
    </div>
  </nav>
);

export default PageNavbar;
