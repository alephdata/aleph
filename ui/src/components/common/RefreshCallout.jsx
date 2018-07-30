import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Callout } from '@blueprintjs/core';

import AuthenticationDialog from 'src/dialogs/AuthenticationDialog/AuthenticationDialog';
import { selectSession, selectMetadata } from 'src/selectors';

import './SignInCallout.css';

class RefreshCallout extends React.Component {

  render() {

    return (
      <React.Fragment>
        <Callout className="pt-icon-info-sign pt-intent-warning">
          <FormattedMessage
            id="refresh.callout_message"
            defaultMessage="Some files are in a pending state. Please refresh the page so you can access them!"
          />
        </Callout>
      </React.Fragment>
    )
  }
}

export default RefreshCallout;
