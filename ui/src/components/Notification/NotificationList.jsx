import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Waypoint } from 'react-waypoint';
import { ErrorSection } from 'components/common';
import { queryNotifications } from 'actions';
import { selectNotificationsResult } from 'selectors';
import Notification from 'components/Notification/Notification';
import NotificationListFilter from 'components/Notification/NotificationListFilter';

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
    this.updateQuery = this.updateQuery.bind(this);
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

  updateQuery(newQuery) {
    const { history, location } = this.props;

    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
    });
  }

  fetchIfNeeded() {
    const { result, query } = this.props;
    if (result.shouldLoad) {
      this.props.queryNotifications({ query });
    }
  }

  render() {
    const { query, result, intl } = this.props;
    const skeletonItems = [...Array(15).keys()];

    if (result.isError || result.total === 0) {
      return (
        <ErrorSection
          icon="notifications"
          title={result.isError ? result.error.message : intl.formatMessage(messages.no_notifications)}
        />
      );
    }

    return (
      <div className="NotificationList">
        <NotificationListFilter query={query} updateQuery={this.updateQuery} result={result} />
        <ul className="NotificationList__items">
          {result.results && result.results.map(
            notif => <Notification key={notif.id} notification={notif} />,
          )}
          {result.isPending && skeletonItems.map(
            item => <Notification key={item} isPending />,
          )}
        </ul>
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-300px"
          scrollableAncestor={window}
        />
      </div>
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
