import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Button, Intent } from '@blueprintjs/core';

const PasswordAuth = ({onSubmit, showEmail, showName, showPassword, buttonText, children}) => {
  let emailElement, passwordElement, nameElement;

  const submit = (event) => {
    event.preventDefault();

    onSubmit({
      email: showEmail && emailElement.value,
      password: showPassword && passwordElement.value,
      name: showName && nameElement.value
    });
  };

  return (
    <form onSubmit={submit} className="pt-card">
      {showEmail && <label className="pt-label">
          <FormattedMessage id="password_auth.email" defaultMessage="Email address"/>
          <input className="pt-input pt-fill" type="email" name="email" required
                 ref={(el) => emailElement = el}/>
        </label>}
      {showName &&
        <label className="pt-label">
          <FormattedMessage id="password_auth.name" defaultMessage="Your Name"/>
          <input className="pt-input pt-fill" type="text" name="name" required
                 ref={(el) => nameElement = el}/>
        </label>}
      {showPassword &&
        <label className="pt-label">
          <FormattedMessage id="password_auth.password" defaultMessage="Password"/>
          <input className="pt-input pt-fill" type="password" name="password" required
                 ref={(el) => passwordElement = el}/>
        </label>}

      <div className="flex-row">
        <span>
          <Button className="pt-large" intent={Intent.PRIMARY} type="submit">
            {buttonText}
          </Button>
        </span>
        <span>
          {children}
        </span>
      </div>
    </form>
  );
};

export const PasswordAuthLogin = ({onSubmit}) => (
  <PasswordAuth onSubmit={onSubmit} showEmail showPassword
                buttonText={<FormattedMessage id="password_auth.signin" defaultMessage="Sign in"/>}>{' '}&nbsp;
    <FormattedMessage id="password_auth.no_account" defaultMessage="Haven't got an account?" />{' '}
    <Link to="/signup">
      <FormattedMessage id="password_auth.signup" defaultMessage="Sign up"/>
    </Link>
  </PasswordAuth>
);

export const PasswordAuthSignup = ({onSubmit}) => (
  <PasswordAuth onSubmit={onSubmit} showEmail
                buttonText={<FormattedMessage id="password_auth.signup" defaultMessage="Sign up"/>}>{' '}&nbsp;
    <FormattedMessage id="password_auth.has_account" defaultMessage="Already have an account?"/>{' '}
    <Link to="/login"><FormattedMessage id="password_auth.signin" defaultMessage="Sign in"/></Link>
  </PasswordAuth>
);

export const PasswordAuthActivate = ({onSubmit}) => (
  <PasswordAuth onSubmit={onSubmit} showPassword showName
                buttonText={<FormattedMessage id="password_auth.activate" defaultMessage="Activate"/>}/>
);
