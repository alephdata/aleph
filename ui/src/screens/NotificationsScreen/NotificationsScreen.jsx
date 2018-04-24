import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import { NonIdealState } from '@blueprintjs/core';
import Waypoint from 'react-waypoint';

import Query from 'src/app/Query';
import { queryNotifications } from 'src/actions';
import { selectNotificationsResult } from 'src/selectors';
import { Screen, SinglePane, SectionLoading, ErrorScreen } from 'src/components/common';
import Notification from 'src/components/Notification/Notification';

import './NotificationsScreen.css';


const messages = defineMessages({
  title: {
    id: 'notifications.title',
    defaultMessage: 'Your notifications',
  },
  no_notifications: {
    id: 'notifications.no_notifications',
    defaultMessage: 'You do not have any notifications.',
  }
});


class NotificationsScreen extends React.Component {
  constructor(props) {
    super(props);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchIfNeeded();
    }
  }

  fetchIfNeeded() {
    const { result, query, queryNotifications } = this.props;
    if (result.total === undefined && !result.isLoading) {
      queryNotifications({ query });
    }
  }

  getMoreResults() {
    const { query, result, queryNotifications } = this.props;
    if (!result.isLoading && result.next) {
      queryNotifications({ query, next: result.next });
    }
  }

  render() {
    const { result, intl } = this.props;

    if (result.isError) {
      return <ErrorScreen error={result.error} />
    }

    return (
      <Screen title={intl.formatMessage(messages.title)}>
        <SinglePane className="NotificationsScreen" limitedWidth={true}>
          { result.total === 0 &&
            <NonIdealState visual="issue"
                           title={intl.formatMessage(messages.no_notifications)} />
          }
          { result.total !== 0 &&
            <ul className="notifications-list">
              {result.results.map((notification) =>
                <Notification key={notification.id}
                              notification={notification} />
              )}
            </ul>
          }
          { !result.isLoading && result.next && (
            <Waypoint
              onEnter={this.getMoreResults}
              bottomOffset="-600px"
              scrollableAncestor={window} />
          )}
          { result.isLoading && (
            <SectionLoading />
          )}
        </SinglePane>
      </Screen>
    )
  }
}


const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = Query.fromLocation('notifications', location, {}, 'notifications')
    .limit(100);
  const result = selectNotificationsResult(state, query);
  return { query, result };
};

NotificationsScreen = connect(mapStateToProps, { queryNotifications })(NotificationsScreen);
NotificationsScreen = withRouter(NotificationsScreen);
export default injectIntl(NotificationsScreen);
