import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Waypoint } from 'react-waypoint';
import { ErrorSection } from 'src/components/common';
import { queryNotifications } from 'src/actions';
import { selectNotificationsResult } from 'src/selectors';
import Notification from 'src/components/Notification/Notification';

import './NotificationList.scss';


const messages = defineMessages({
  no_notifications: {
    id: 'notifications.no_notifications',
    defaultMessage: 'You have no unseen notifications',
  },
});

class NotificationList extends Component {
  constructor(props) {
    super(props);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && !result.isPending && result.next && !result.isError) {
      this.props.queryNotifications({ query, next: result.next });
    }
  }

  fetchIfNeeded() {
    const { result, query } = this.props;
    if (result.shouldLoad) {
      this.props.queryNotifications({ query });
    }
  }

  render() {
    const { result, intl } = this.props;
    const skeletonItems = [...Array(15).keys()];

    if (result.total === 0) {
      return (
        <ErrorSection
          icon="notifications"
          title={intl.formatMessage(messages.no_notifications)}
        />
      );
    }

    return (
      <>
        <ul className="NotificationList">
          {result.results && result.results.map(
            notif => <Notification key={notif.id} notification={notif} />,
          )}
          {skeletonItems.map(
            item => <Notification key={item} isLoading />,
          )}
        </ul>
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-300px"
          scrollableAncestor={window}
        />
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  const result = selectNotificationsResult(state, query);
  return { query, result };
};
const mapDispatchToProps = { queryNotifications };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(NotificationList);
