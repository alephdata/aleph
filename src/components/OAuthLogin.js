import React from 'react';
import {FormattedMessage} from "react-intl";

const OAuthLogin = ({providers}) => {
  const location = window.location;
  const targetUrl = `${location.protocol}//${location.host}/login`;
  const queryString = `?next=${encodeURIComponent(targetUrl)}`;

  return <div className="pt-button-group pt-vertical pt-align-left pt-large">
    {providers.map(provider => <p key={provider.name}>
      <a href={`${provider.login}${queryString}`} className="pt-button pt-intent-primary pt-icon-log-in">
        <FormattedMessage id="login.provider" defaultMessage="Sign in with {label}"
                          values={{label: provider.label}}/>
      </a>
    </p>)}
  </div>
};

export default OAuthLogin;
