import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import Query from 'src/app/Query';
import DualPane from 'src/components/common/DualPane';
import Toolbar from 'src/components/Toolbar/Toolbar';
import ActivityTimeline from "src/components/Activity/ActivityTimeline";
import Screen from 'src/components/Screen/Screen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';

import {selectQueryLog} from "src/selectors";

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
* TODO-DONE: Implement item removal functionality
* TODO-DONE: Improve optimization for alert requests
* * * * * * * Visual stage
* * * TODO-DONE: Make it beautiful
* * * * * * * Optimization & clean-Up
* TODO-DONE: Clean up component
* TODO-DONE: Optimize object constructions
* TODO-DONE: Check imports
* TODO-DONE: Optimize re-rendering
* * TODO: Remove redux logging
* TODO-DONE: Clear console.log's and debuggers
* TODO: Fix ESLint and SonarLint issues
* */

const messages = defineMessages({
  title: {
    id: 'activityScreen.title',
    defaultMessage: 'Your activities',
  }
});


class ActivityScreen extends React.Component {
  state = {isMarkedRead: false};

  render() {
    const { query, result, intl } = this.props;

    if (result.isError) {
      return <ErrorScreen error={result.error} />
    }

    return (
      <Screen title={intl.formatMessage(messages.title)} requireSession={true}>
        <DualPane className="ActivityScreen">
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
  const result = selectQueryLog(state, query);
  return { query, result };
};

ActivityScreen = connect(mapStateToProps)(ActivityScreen);
ActivityScreen = withRouter(ActivityScreen);
export default injectIntl(ActivityScreen);
