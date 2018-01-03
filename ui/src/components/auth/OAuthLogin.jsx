import React from 'react';
import {FormattedMessage} from 'react-intl';
import queryString from 'query-string';

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

export const handleOAuthCallback = (onLoginFn) => {
  const parsedHash = queryString.parse(window.location.hash);
  if (parsedHash.token) {
    onLoginFn(parsedHash.token);
    window.location.hash = '';
  }
};

export default OAuthLogin;
