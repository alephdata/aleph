import React, { PureComponent } from 'react';
import connect from 'react-redux/es/connect/connect';
import {Callout, Tag} from '@blueprintjs/core';
import {FormattedMessage} from 'react-intl';
import SearchAlert from 'src/components/SearchAlert/SearchAlert';
import {selectAlerts, selectSession} from 'src/selectors';

class SuggestAlert extends PureComponent{
  render(){
    const { queryText, session} = this.props;
    if (!session.loggedIn || !queryText || !queryText.trim().length || SearchAlert.doesAlertExist(this.props)) {
      return null;
    }

    return (<Callout>
      <FormattedMessage
        id="alert.suggest.text"
        defaultMessage={`Get notified {alertComponent} when data related to {queryText} is added.`}
        values={{alertComponent: <SearchAlert queryText={queryText}/>, queryText:<Tag large>{queryText}</Tag>}}
      />

    </Callout>)
  }
}

const mapStateToProps = (state) => {
  return {
    alerts: selectAlerts(state),
    session: selectSession(state),
  }
};


SuggestAlert = connect(mapStateToProps)(SuggestAlert)
export {SuggestAlert};
export default SuggestAlert;