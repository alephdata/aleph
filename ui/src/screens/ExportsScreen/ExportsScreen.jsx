import React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import Screen from 'src/components/Screen/Screen';
import Dashboard from 'src/components/Dashboard/Dashboard';
import ExportsList from 'src/components/Exports/ExportsList';

const messages = defineMessages({
  title: {
    id: 'exports.title',
    defaultMessage: 'Exports ready for download',
  },
});

export class ExportsScreen extends React.Component {
  render() {
    const { intl } = this.props;
    return (
      <Screen
        title={intl.formatMessage(messages.title)}
        className="ExportsScreen"
        requireSession
      >
        <Dashboard>
          <div className="Dashboard__title-container">
            <h5 className="Dashboard__title">
              {intl.formatMessage(messages.title)}
            </h5>
            <p className="Dashboard__subheading">
              <FormattedMessage
                id="exports.manager.description"
                defaultMessage="Below is a list of your exports. Make sure to download them before they expire."
              />
            </p>
          </div>
          <ExportsList />
        </Dashboard>
      </Screen>
    );
  }
}

export default injectIntl(ExportsScreen);
