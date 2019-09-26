import React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Query from 'src/app/Query';
import { deleteNotifications } from 'src/actions';
import NotificationList from 'src/components/Notification/NotificationList';
import Screen from 'src/components/Screen/Screen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import Dashboard from 'src/components/Dashboard/Dashboard';


import { selectNotificationsResult } from 'src/selectors';

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
  constructor(props) {
    super(props);
    this.state = { isMarkedRead: false };
    this.onMarkRead = this.onMarkRead.bind(this);
  }

  async onMarkRead(event) {
    event.preventDefault();
    this.setState({ isMarkedRead: true });
    await this.props.deleteNotifications();
  }

  render() {
    const { query, result, intl, role } = this.props;
    const { isMarkedRead } = this.state;
    const canMarkRead = !isMarkedRead && result.total !== undefined && result.total > 0;

    if (result.isError) {
      return <ErrorScreen error={result.error} />;
    }

    return (
      <Screen title={intl.formatMessage(messages.title)} requireSession>
        <Dashboard>
          <div className="Dashboard__title-container">
            <div className="Dashboard__actions">
              <Button icon="tick" className="mark-read bp3-intent-primary" onClick={this.onMarkRead} disabled={!canMarkRead}>
                <FormattedMessage
                  id="notifications.mark.read"
                  defaultMessage="Clear all"
                />
              </Button>
            </div>
            <h5 className="Dashboard__title">
              {intl.formatMessage(messages.greeting, { role: role ? role.name : '' })}
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
  const query = Query.fromLocation('notifications', location, {}, 'notifications').limit(40);
  const result = selectNotificationsResult(state, query);

  return {
    query,
    result,
    role: state.session ? state.session.role : null,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { deleteNotifications }),
  injectIntl,
)(NotificationsScreen);
