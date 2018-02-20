import React from 'react';
import {Link} from 'react-router-dom';

import AuthButtons from 'src/components/auth/AuthButtons';

import './PageNavbar.css';

const PageNavbar = ({metadata, session}) => (
  <nav className="PageNavbar pt-navbar pt-dark">
    <div className="pt-navbar-group pt-align-left">
      <div className="pt-navbar-heading">
        <Link to="/">
          <img src={metadata.app.logo} alt={metadata.app.title} />
        </Link>
      </div>
      <div className="pt-navbar-heading">
        <Link to="/">{metadata.app.title}</Link>
      </div>
    </div>
    <div className="pt-navbar-group pt-align-right">
      <AuthButtons session={session} auth={metadata.auth} />
    </div>
  </nav>
);

export default PageNavbar;
