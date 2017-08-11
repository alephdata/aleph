import React from 'react';
import {FormattedMessage} from "react-intl";
import queryString from "query-string";

const OAuthLogin = ({providers, onLogin}) => {
  const location = window.location;
  const targetUrl = `${location.protocol}//${location.host}/login`;
  const loginUrlQueryString = `?next=${encodeURIComponent(targetUrl)}`;

  return <div className="pt-button-group pt-vertical pt-align-left pt-large">
    {providers.map(provider => <p key={provider.name}>
      <a href={`${provider.login}${loginUrlQueryString}`} className="pt-button pt-intent-primary pt-icon-log-in">
        <FormattedMessage id="login.provider" defaultMessage="Sign in with {label}"
                          values={{label: provider.label}}/>
      </a>
    </p>)}
  </div>
};

export const handleOAuthCallback = (onLoginFn) => {
  const parsedHash = queryString.parse(location.hash);
  if (parsedHash.token) {
    onLoginFn(parsedHash.token);
    location.hash = '';
  }
};

export default OAuthLogin;
