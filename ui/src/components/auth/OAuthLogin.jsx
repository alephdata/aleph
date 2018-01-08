import React from 'react';
import {FormattedMessage} from 'react-intl';

import './OAuthLogin.css';

const OAuthLogin = ({provider}) => {
  const location = window.location;
  const targetUrl = `${location.protocol}//${location.host}/login`;
  const loginUrlQueryString = `?next=${encodeURIComponent(targetUrl)}`;

  return (
    <div className="pt-card">
      <a className="oauth-provider" href={`${provider}${loginUrlQueryString}`}>
        <FormattedMessage id="login.oauth" defaultMessage="Sign in" />
      </a>
    </div>
  );
};

export default OAuthLogin;
