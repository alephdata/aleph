import React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter'
import Query from 'app/Query';
import NotificationList from 'components/Notification/NotificationList';
import Screen from 'components/Screen/Screen';
import LoadingScreen from 'components/Screen/LoadingScreen';
import Dashboard from 'components/Dashboard/Dashboard';
import { selectNotificationsResult, selectCurrentRole } from 'selectors';
import LandingQuickLinks from 'components/common/LandingQuickLinks';

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
    const { query, intl, role } = this.props;
    const screenProps = {
      title: intl.formatMessage(messages.title),
      requireSession: true,
      className: 'NotificationsScreen'
    };

    if (!role.id) {
      return <LoadingScreen {...screenProps} />
    }

    return (
      <Screen {...screenProps}>
        <Dashboard>
          <div className="Dashboard__title-container">
            <h5 className="Dashboard__title">
              {intl.formatMessage(messages.greeting, { role: role.name || '' })}
            </h5>
            <p className="Dashboard__subheading">
              <FormattedMessage
                id="notification.description"
                defaultMessage="View the latest updates to datasets, investigations, groups and tracking alerts you follow."
              />
            </p>
          </div>
          <LandingQuickLinks />
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
