import React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Query from 'app/Query';
import NotificationList from 'components/Notification/NotificationList';
import Screen from 'components/Screen/Screen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import LoadingScreen from 'components/Screen/LoadingScreen';
import Dashboard from 'components/Dashboard/Dashboard';
import { selectNotificationsResult, selectCurrentRole } from 'selectors';

import './NotificationsScreen.scss';


const messages = defineMessages({
  title: {
    id: 'notifications.title',
    defaultMessage: 'Recent notifications',
  },
  greeting: {
    id: 'notifications.greeting',
    defaultMessage: 'What\'s new, {role}?',
  },
});


export class NotificationsScreen extends React.Component {
  render() {
    const { query, result, intl, role } = this.props;

    if (result.isError) {
      return <ErrorScreen error={result.error} requireSession />;
    }

    if (!role.id) {
      return <LoadingScreen requireSession />
    }

    return (
      <Screen title={intl.formatMessage(messages.title)} requireSession>
        <Dashboard>
          <div className="Dashboard__title-container">
            <h5 className="Dashboard__title">
              {intl.formatMessage(messages.greeting, { role: role.name || '' })}
            </h5>
            <p className="Dashboard__subheading">
              <FormattedMessage
                id="notification.description"
                defaultMessage="View the latest updates to datasets, groups and tracking alerts you follow."
              />
            </p>
          </div>
          <NotificationList query={query} />
        </Dashboard>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;

  const query = Query.fromLocation('notifications', location, { 'facet': 'event' }, 'notifications')
    .limit(40);

  return {
    query,
    result: selectNotificationsResult(state, query),
    role: selectCurrentRole(state),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(NotificationsScreen);
