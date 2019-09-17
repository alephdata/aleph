import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
// import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
// import { Button, Intent, FormGroup, InputGroup, Checkbox } from '@blueprintjs/core';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

// import { showSuccessToast } from 'src/app/toast';
import Screen from 'src/components/Screen/Screen';
import Dashboard from 'src/components/Dashboard/Dashboard';
// import ClipboardInput from 'src/components/common/ClipboardInput';
// import { updateRole, fetchRole } from 'src/actions';
// import { selectSession, selectMetadata } from 'src/selectors';

import './HistoryScreen.scss';


const messages = defineMessages({
  title: {
    id: 'settings.title',
    defaultMessage: 'Searches & alerts',
  },
});


export class HistoryScreen extends React.Component {
  //   constructor(props) {
  //     super(props);
  //   }
  //   componentDidUpdate(prevProps) {
  //   }

  render() {
    const { intl } = this.props;
    return (
      <Screen title={intl.formatMessage(messages.title)} requireSession>
        <Dashboard>
          {'I am a banana!'}
        </Dashboard>
      </Screen>
    );
  }
}

const mapStateToProps = state => ({
  ...state,
});

HistoryScreen = withRouter(HistoryScreen);
HistoryScreen = connect(mapStateToProps, { })(HistoryScreen);
HistoryScreen = injectIntl(HistoryScreen);
export default HistoryScreen;
