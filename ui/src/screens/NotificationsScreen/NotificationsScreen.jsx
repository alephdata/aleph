import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { NonIdealState, Button } from '@blueprintjs/core';
import Waypoint from 'react-waypoint';

import Query from 'src/app/Query';
import { queryNotifications, deleteNotifications } from 'src/actions';
import { selectNotificationsResult } from 'src/selectors';
import { Screen, DualPane, SectionLoading, ErrorScreen } from 'src/components/common';
import { Toolbar } from 'src/components/Toolbar';
// import { showSuccessToast } from "src/app/toast";
import Notification from 'src/components/Notification/Notification';
import AlertsManager from 'src/components/AlertsManager/AlertsManager';

import './NotificationsScreen.css';


const messages = defineMessages({
  title: {
    id: 'notifications.title',
    defaultMessage: 'Recent notifications',
  },
  no_notifications: {
    id: 'notifications.no_notifications',
    defaultMessage: 'You do not have any notifications',
  },
});


class NotificationsScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {isMarkedRead: false};
    this.getMoreResults = this.getMoreResults.bind(this);
    this.onMarkRead = this.onMarkRead.bind(this);
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
    const { result, query } = this.props;
    if (result.total === undefined && !result.isLoading) {
      this.props.queryNotifications({ query });
    }
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (!result.isLoading && result.next) {
      this.props.queryNotifications({ query, next: result.next });
    }
  }

  async onMarkRead(event) {
    event.preventDefault();
    this.setState({isMarkedRead: true});
    await this.props.deleteNotifications();
    // showSuccessToast(intl.formatMessage(messages.marked_read));
  }

  render() {
    const { result, intl } = this.props;
    const { isMarkedRead } = this.state;
    const canMarkRead = !isMarkedRead && result.total !== undefined && result.total > 0;

    if (result.isError) {
      return <ErrorScreen error={result.error} />
    }

    return (
      <Screen title={intl.formatMessage(messages.title)}>
        <DualPane className="NotificationsScreen">
          <AlertsManager/>
          <DualPane.ContentPane>
            <Toolbar>
              <Button icon="tick" className="mark-read" onClick={this.onMarkRead} disabled={!canMarkRead}>
                <FormattedMessage id="notifications.mark_read"
                                  defaultMessage="Mark as seen" />
              </Button>
            </Toolbar>
            { result.total === 0 &&
              <NonIdealState visual="notifications"
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
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    )
  }
}


const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = Query.fromLocation('notifications', location, {}, 'notifications')
    .limit(40);
  const result = selectNotificationsResult(state, query);
  return { query, result };
};

NotificationsScreen = connect(mapStateToProps, { queryNotifications, deleteNotifications })(NotificationsScreen);
NotificationsScreen = withRouter(NotificationsScreen);
export default injectIntl(NotificationsScreen);
