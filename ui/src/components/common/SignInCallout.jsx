import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Callout } from '@blueprintjs/core';

import AuthenticationDialog from 'src/dialogs/AuthenticationDialog/AuthenticationDialog';
import { selectSession, selectMetadata } from 'src/selectors';

import './SignInCallout.scss';


const mapStateToProps = state => ({
  metadata: selectMetadata(state),
  session: selectSession(state),
});

@connect(mapStateToProps)
export default class SignInCallout extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isOpen: false };
    this.onSignIn = this.onSignIn.bind(this);
  }

  onSignIn() {
    this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
  }

  render() {
    const { metadata, session } = this.props;
    const { isOpen } = this.state;

    if (session.loggedIn) {
      return null;
    }

    return (
      <React.Fragment>
        <AuthenticationDialog auth={metadata.auth} isOpen={isOpen} toggleDialog={this.onSignIn} />
        <Callout onClick={this.onSignIn} className="SignInCallout clickable bp3-icon-info-sign bp3-intent-warning">
          <FormattedMessage
            id="search.callout_message"
            defaultMessage="Some sources are hidden from anonymous users. Please sign in to see all results you’re authorised to access!"
          />
        </Callout>
      </React.Fragment>
    );
  }
}
