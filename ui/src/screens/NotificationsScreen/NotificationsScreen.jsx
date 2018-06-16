import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Button } from '@blueprintjs/core';

import Query from 'src/app/Query';
import { deleteNotifications } from 'src/actions';
import { Screen, DualPane, ErrorScreen } from 'src/components/common';
import { Toolbar } from 'src/components/Toolbar';
// import { showSuccessToast } from "src/app/toast";
import NotificationList from 'src/components/Notification/NotificationList';
import AlertsManager from 'src/components/AlertsManager/AlertsManager';
import { selectNotificationsResult } from "src/selectors";

import './NotificationsScreen.css';


const messages = defineMessages({
  title: {
    id: 'notifications.title',
    defaultMessage: 'Recent notifications',
  }
});


class NotificationsScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {isMarkedRead: false};
    this.onMarkRead = this.onMarkRead.bind(this);
  }

  async onMarkRead(event) {
    event.preventDefault();
    this.setState({isMarkedRead: true});
    await this.props.deleteNotifications();
  }

  render() {
    const { query, result, intl } = this.props;
    const { isMarkedRead } = this.state;
    const canMarkRead = !isMarkedRead && result.total !== undefined && result.total > 0;

    if (result.isError) {
      return <ErrorScreen error={result.error} />
    }

    return (
      <Screen title={intl.formatMessage(messages.title)} requireSession={true}>
        <DualPane className="NotificationsScreen">
          <DualPane.ContentPane>
            <Toolbar>
              <h1>
                <FormattedMessage id="notifications.title" defaultMessage="Your notifications"/>
              </h1>
              <Button icon="tick" className="mark-read" onClick={this.onMarkRead} disabled={!canMarkRead}>
                <FormattedMessage id="notifications.mark_read"
                                  defaultMessage="Mark as seen" />
              </Button>
            </Toolbar>
            <NotificationList query={query} />
          </DualPane.ContentPane>
          <AlertsManager/>
        </DualPane>
      </Screen>
    )
  }
}


const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = Query.fromLocation('notifications', location, {}, 'notifications').limit(40);
  const result = selectNotificationsResult(state, query);
  return { query, result };
};

NotificationsScreen = connect(mapStateToProps, { deleteNotifications })(NotificationsScreen);
NotificationsScreen = withRouter(NotificationsScreen);
export default injectIntl(NotificationsScreen);
