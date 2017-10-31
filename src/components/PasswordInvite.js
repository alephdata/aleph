import React from 'react';
import {FormattedMessage} from 'react-intl';
import {Link} from 'react-router-dom';
import {Button, Intent} from '@blueprintjs/core';

const PasswordSignup = ({onSignup}) => {
  let emailElement;

  const submit = (event) => {
    event.preventDefault();
    onSignup({email: emailElement.value});
  };

  return (
    <form onSubmit={submit} className="pt-card">
      <label className="pt-label">
        <FormattedMessage id="invite.email" defaultMessage="Email address"/>
        <input className="pt-input pt-fill" type="email" name="email" required ref={(el) => emailElement = el}/>
      </label>
      <div className="flex-row">
        <span>
          <Button className="pt-large" intent={Intent.PRIMARY} type="submit">
            <FormattedMessage id="invite.submit" defaultMessage="Sign up"/>
          </Button>
        </span>
        <span>
          <FormattedMessage id="invite.has_account" defaultMessage="Already have an account?"/>{' '}
          <Link to="/login"><FormattedMessage id="invite.signin" defaultMessage="Sign in"/></Link>
        </span>
      </div>
    </form>
  );
};

export default PasswordSignup;
