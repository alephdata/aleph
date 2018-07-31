import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Callout } from '@blueprintjs/core';


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
