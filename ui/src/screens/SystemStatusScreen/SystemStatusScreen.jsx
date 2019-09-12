import React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Query from 'src/app/Query';
import { DualPane, Breadcrumbs } from 'src/components/common';
import Toolbar from 'src/components/Toolbar/Toolbar';
import Dashboard from 'src/components/Dashboard/Dashboard';
import Screen from 'src/components/Screen/Screen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';


import './SystemStatusScreen.scss';


const messages = defineMessages({
  title: {
    id: 'dashboard.title',
    defaultMessage: 'System Status',
  },
});


export class SystemStatusScreen extends React.Component {
  render() {
    const { query, result, intl } = this.props;

    if (result.isError) {
      return <ErrorScreen error={result.error} />;
    }

    return (
      <Screen title={intl.formatMessage(messages.title)} requireSession>
        <Breadcrumbs>
          <Breadcrumbs.Text text={intl.formatMessage(messages.title)} />
        </Breadcrumbs>
        <DualPane className="SystemStatusScreen">
          <DualPane.ContentPane className="padded">
            <Toolbar>
              <h1>
                <FormattedMessage id="notifications.heading" defaultMessage="Active Collections" />
              </h1>
            </Toolbar>
            <Dashboard query={query} />
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = Query.fromLocation('dashboard', location, {}, 'dashbaord');
  const result = {};
  return { query, result };
};

const mapDispatchToProps = {};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(SystemStatusScreen);
