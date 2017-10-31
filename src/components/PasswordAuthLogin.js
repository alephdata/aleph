import React from 'react';
import {FormattedMessage} from 'react-intl';
import {Link} from 'react-router-dom';
import {Button, Intent} from '@blueprintjs/core';

const PasswordAuthForm = ({onSubmit, showName, showPassword, children}) => {
  let emailElement, passwordElement, nameElement;

  const submit = (event) => {
    event.preventDefault();

    onSubmit({
      email: emailElement.value,
      password: showPassword && passwordElement.value,
      name: showName && nameElement.value
    });
  };

  return (
    <form onSubmit={submit} className="pt-card">
      <label className="pt-label">
        <FormattedMessage id="invite.email" defaultMessage="Email address"/>
        <input className="pt-input pt-fill" type="email" name="email" required
               ref={(el) => emailElement = el}/>
      </label>
      {showName &&
        <label className="pt-label">
          <FormattedMessage id="signup.name" defaultMessage="Your Name"/>
          <input className="pt-input pt-fill" type="text" name="name" required
                 ref={(el) => nameElement = el}/>
        </label>}
      {showPassword &&
        <label className="pt-label">
          <FormattedMessage id="signup.password" defaultMessage="Password"/>
          <input className="pt-input pt-fill" type="password" name="password" required
                 ref={(el) => passwordElement = el}/>
        </label>}

      <div className="flex-row">{children}</div>
    </form>
  );
};

export const PasswordLogin = ({onSubmit}) => (
  <PasswordAuthForm onSubmit={onSubmit} showPassword>
    <span>
      <Button className="pt-large" intent={Intent.PRIMARY} type="submit">
        <FormattedMessage id="login.submit" defaultMessage="Sign in"/>
      </Button>
    </span>
    <span>
      <FormattedMessage id="login.no_account" defaultMessage="Haven't got an account?" />{' '}
      <Link to="/invite"><FormattedMessage id="login.signup" defaultMessage="Sign up"/></Link>
    </span>
  </PasswordAuthForm>
);

export const PasswordSignup = ({onSubmit, showFull}) => (
  <PasswordAuthForm onSubmit={onSubmit} showPassword={showFull} showName={showFull}>
    <span>
      <Button className="pt-large" intent={Intent.PRIMARY} type="submit">
        <FormattedMessage id="invite.submit" defaultMessage="Sign up"/>
      </Button>
    </span>
    <span>
      <FormattedMessage id="invite.has_account" defaultMessage="Already have an account?"/>{' '}
      <Link to="/login"><FormattedMessage id="invite.signin" defaultMessage="Sign in"/></Link>
    </span>
  </PasswordAuthForm>
);
