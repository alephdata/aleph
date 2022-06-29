{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}


import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Callout } from '@blueprintjs/core';
import { Button } from '@blueprintjs/core/lib/esm/components/button/buttons';


import AuthenticationDialog from 'dialogs/AuthenticationDialog/AuthenticationDialog';
import { selectSession, selectMetadata } from 'selectors';

import './SignInCallout.scss';


const mapStateToProps = state => ({
  metadata: selectMetadata(state),
  session: selectSession(state),
});


export class SignInCallout extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isAuthOpen: false, isCalloutShown: true };
    this.onSignIn = this.onSignIn.bind(this);
    this.onHideCallout = this.onHideCallout.bind(this);
  }

  onSignIn() {
    this.setState(({ isAuthOpen }) => ({ isAuthOpen: !isAuthOpen }));
  }

  onHideCallout() {
    this.setState(({ isCalloutShown }) => ({ isCalloutShown: !isCalloutShown }));
  }

  render() {
    const { metadata, session } = this.props;
    const { isAuthOpen, isCalloutShown } = this.state;

    if (session.loggedIn || !isCalloutShown) {
      return null;
    }

    return (
      <>
        <AuthenticationDialog
          auth={metadata.auth}
          isOpen={isAuthOpen}
          toggleDialog={this.onSignIn}
        />
        <Callout className="SignInCallout bp3-icon-info-sign bp3-intent-warning">
          <FormattedMessage
            id="search.callout_message"
            defaultMessage="Some sources are hidden from anonymous users. {signInButton} to see all results you are authorised to access."
            values={{
              signInButton: (
                <Button
                  className="sign-in-button"
                  minimal
                  small
                  onClick={this.onSignIn}
                >
                  <FormattedMessage
                    id="search.callout_message.button_text"
                    defaultMessage="Sign in"
                  />
                </Button>
              ),
            }}
          />
          <Button className="bp3-minimal button-close" icon="cross" onClick={this.onHideCallout} />
        </Callout>
      </>
    );
  }
}

export default connect(mapStateToProps)(SignInCallout);
