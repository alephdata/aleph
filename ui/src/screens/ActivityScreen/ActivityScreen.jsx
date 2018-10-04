import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Button } from '@blueprintjs/core';

import Query from 'src/app/Query';
import { deleteNotifications } from 'src/actions';
import {  DualPane } from 'src/components/common';
import Toolbar from 'src/components/Toolbar/Toolbar';
import NotificationList from 'src/components/Notification/NotificationList';
import ActivityTimeline from "../../components/Activity/ActivityTimeline";
import Screen from 'src/components/Screen/Screen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';

import { selectNotificationsResult } from "src/selectors";

import './ActivityScreen.css';
/* *
* TODO-DONE: Make sure routing works well - DONE
* TODO-DONE: Include fetch action - DONE
* TODO-DONE: Integrate timeline - DONE
* TODO-DONE: Integrate timline with query logs - DONE
* TODO-DONE: Make fetch action smart to not fetch if data exist - DONE
* TODO-DONE: Must implement lazy loading - DONE
* TODO-DONE: Add date to dynamicaly adding - DONE
* TODO-DONE: Make redo search function - DONE
* TODO-DONE: Make sure route is hidden for non-auto users
* TODO-DONE: Implement translations
* TODO-DONE: term as an alert
* TODO: Implement item removal functionality
* * * * * * * Visual stage
* * * TODO: Make it beautiful
* * * * * * * Optimization & clean-Up
* TODO: Clean up component
* TODO: Optimize object constructions
* TODO: Check imports
* * TODO: Remove redux logging
* TODO: Optimize re-rendering
* TODO: Clear console.log's and debuggers
* TODO: Fix ESLint and SonarLint issues
* */

const messages = defineMessages({
  title: {
    id: 'activityScreen.title',
    defaultMessage: 'Your activities',
  }
});


class ActivityScreen extends React.Component {
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
          <DualPane.ContentPane className="padded">
            <Toolbar>
              <h1>
                <FormattedMessage id="activity.heading" defaultMessage="All activities"/>
              </h1>
            </Toolbar>
            <ActivityTimeline query={query} />
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    )
  }
}


const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = Query.fromLocation('queryLog', location, {}, 'queryLog').limit(40);
  const result = selectNotificationsResult(state, query);
  return { query, result };
};

ActivityScreen = connect(mapStateToProps, { deleteNotifications })(ActivityScreen);
ActivityScreen = withRouter(ActivityScreen);
export default injectIntl(ActivityScreen);
