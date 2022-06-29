{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter'
import { ErrorSection, QueryInfiniteLoad } from 'components/common';
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
    this.updateQuery = this.updateQuery.bind(this);
  }

  updateQuery(newQuery) {
    const { navigate, location } = this.props;

    navigate({
      pathname: location.pathname,
      search: newQuery.toLocation(),
    });
  }

  render() {
    const { query, result, intl, showCollectionLinks, loadOnScroll = true } = this.props;
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
            notif => <Notification key={notif.id} notification={notif} showCollectionLinks={showCollectionLinks} />,
          )}
          {result.isPending && skeletonItems.map(
            item => <Notification key={item} isPending />,
          )}
        </ul>
        <QueryInfiniteLoad
          query={query}
          result={result}
          fetch={this.props.queryNotifications}
          loadOnScroll={loadOnScroll}
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

export default compose(
  withRouter,
  connect(mapStateToProps, { queryNotifications }),
  injectIntl,
)(NotificationList);
