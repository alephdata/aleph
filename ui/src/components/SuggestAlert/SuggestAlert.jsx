import React, { PureComponent } from 'react';
import connect from 'react-redux/es/connect/connect';
import { Callout } from '@blueprintjs/core';
import { FormattedMessage } from 'react-intl';
import SearchAlert from 'components/SearchAlert/SearchAlert';
import { QueryText } from 'components/common';
import { selectAlerts, selectSession } from 'selectors';

class SuggestAlert extends PureComponent {
  render() {
    const { queryText, session } = this.props;
    if (!session.loggedIn
      || !queryText
      || !queryText.trim().length
      || SearchAlert.doesAlertExist(this.props)
    ) {
      return null;
    }

    return (
      <Callout>
        <FormattedMessage
          id="alert.suggest.prompt"
          defaultMessage={'Track {queryText}: {alertComponent}'}
          values={{
            alertComponent: <SearchAlert queryText={queryText} />,
            queryText: <QueryText query={queryText} />,
          }}
        />

      </Callout>
    );
  }
}


const mapStateToProps = state => ({
  alerts: selectAlerts(state),
  session: selectSession(state),
});
export default connect(mapStateToProps)(SuggestAlert);
