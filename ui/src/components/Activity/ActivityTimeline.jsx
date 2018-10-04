import React, {PureComponent} from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';
import Waypoint from 'react-waypoint';
import { Timeline } from 'react-event-timeline'

import { SectionLoading, ErrorSection } from 'src/components/common';
import ActivityItem  from './ActivityItem';
import { queryNotifications } from "src/actions";
import {selectNotificationsResult, selectQueryLog} from "src/selectors";
import {fetchQueryLogs} from "src/actions/queryLogsActions";
import ErrorScreen from "../Screen/ErrorScreen";


const messages = defineMessages({
  no_activity: {
    id: 'activity.no_activity',
    defaultMessage: 'There are no activity logs',
  },
});


class ActivityTimeline extends PureComponent {
  constructor(props) {
    super(props);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { result, query } = this.props;
    if (!result.isLoading && result.shouldLoad) {
      this.props.fetchQueryLogs({query, next: result.next});
    }
  }

  getMoreResults() {
    console.log('getting mroe results');
    const { query, result } = this.props;
    if (!result.isLoading && result.next) {
      this.props.fetchQueryLogs({ query, next: result.next });
    }

  }

  render() {
    const { result, intl } = this.props;

    return (
      <React.Fragment>
        { result.isError ? <ErrorScreen visual="error"/> :
          ( result.total === 0 ?
        <ErrorSection visual="activity log"
                      title={intl.formatMessage(messages.no_activity)} />
          : <Timeline className="ActivityTimeline">
            {[...result.results.values()].reverse().map((activity) =>
              <ActivityItem
                key={activity.id}
                activity={activity}
                type={
                  "search"
                  /*TODO: Identify item type dynamically in the feature when other activity types will arrive*/
                }
              />
            )}
          </Timeline>)
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

const mapStateToProps = (state, { query })  => ({
  result: selectQueryLog(state, query)
});
const mapDispatchToProps = ({
  fetchQueryLogs
});

ActivityTimeline = connect(
  mapStateToProps, mapDispatchToProps
)(injectIntl(ActivityTimeline));

export { ActivityTimeline };
export default ActivityTimeline;