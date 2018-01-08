import React from 'react';
import {Link} from 'react-router-dom';

import AuthButtons from 'src/components/auth/AuthButtons';

const PageNavbar = ({metadata, session}) => (
  <nav className="pt-navbar pt-dark">
    <div className="pt-navbar-group pt-align-left">
      <div className="pt-navbar-heading">
        <Link to="/">{ String.fromCharCode(8501) } {metadata.app.title}</Link>
      </div>
    </div>
    <div className="pt-navbar-group pt-align-right">
      <AuthButtons session={session} auth={metadata.auth} />
    </div>
  </nav>
);

export default PageNavbar;
