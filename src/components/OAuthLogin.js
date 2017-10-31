import React from 'react';
import {FormattedMessage} from 'react-intl';
import queryString from 'query-string';

import './OAuthLogin.css';

const OAuthLogin = ({providers}) => {
  const location = window.location;
  const targetUrl = `${location.protocol}//${location.host}/login`;
  const loginUrlQueryString = `?next=${encodeURIComponent(targetUrl)}`;

  return (
    <div className="pt-card">
      <span>
        <FormattedMessage id="login.oauth" defaultMessage="Sign in with" />
      </span>

      {providers.map(provider => (
        <span key={provider.name}>
          <a className="oauth-provider" href={`${provider.login}${loginUrlQueryString}`}
             data-name={provider.name}></a>
        </span>))}
    </div>
  );
};

export const handleOAuthCallback = (onLoginFn) => {
  const parsedHash = queryString.parse(location.hash);
  if (parsedHash.token) {
    onLoginFn(parsedHash.token);
    location.hash = '';
  }
};

export default OAuthLogin;
