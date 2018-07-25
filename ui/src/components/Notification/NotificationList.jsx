import React, {Component} from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import Waypoint from 'react-waypoint';

import { SectionLoading, ErrorSection } from 'src/components/common';
import Notification from './Notification';
import { queryNotifications } from "src/actions";
import { selectNotificationsResult } from "src/selectors";

import './NotificationList.css';

const messages = defineMessages({
  no_notifications: {
    id: 'notifications.no_notifications',
    defaultMessage: 'There are no notifications',
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

  componentDidUpdate(prevProps) {
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchIfNeeded();
    }
  }

  // componentWillUnmount() {
  // }

  fetchIfNeeded() {
    const { result, query } = this.props;
    if (!result.isLoading) {
      this.props.queryNotifications({ query });
    }
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (!result.isLoading && result.next) {
      this.props.queryNotifications({ query, next: result.next });
    }
  }

  render() {
    const { result, intl } = this.props;

    return (
      <React.Fragment>
        { result.total === 0 &&
          <ErrorSection visual="notifications"
                        title={intl.formatMessage(messages.no_notifications)} />
        }
        { result.total !== 0 &&
          <ul className="NotificationList">
            {result.results.map((notif) =>
              <Notification key={notif.id} notification={notif} />
            )}
          </ul>
        }
        { !result.isLoading && result.next && (
          <Waypoint onEnter={this.getMoreResults}
                    bottomOffset="-600px"
                    scrollableAncestor={window} />
        )}
        { result.isLoading && (
          <SectionLoading />
        )}
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  const result = selectNotificationsResult(state, query);
  return { query, result };
};

NotificationList = connect(mapStateToProps, { queryNotifications })(NotificationList);
NotificationList = withRouter(NotificationList);
export default injectIntl(NotificationList);
