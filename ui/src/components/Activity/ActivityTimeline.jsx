import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {defineMessages, injectIntl} from 'react-intl';
import Waypoint from 'react-waypoint';
import Timeline from 'react-event-timeline/dist/Timeline'
import {SectionLoading, ErrorSection} from 'src/components/common';
import ActivityItem  from './ActivityItem';
import {selectQueryLog} from "src/selectors";
import {fetchQueryLogs} from "src/actions/queryLogsActions";


const messages = defineMessages({
  no_activity: {
    id: 'activity.no_activity',
    defaultMessage: 'There are no activity logs',
  },
});


class ActivityTimeline extends PureComponent {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { result, query } = this.props;
    if (!result.isLoading && result.shouldLoad) {
      this.props.fetchQueryLogs({query, next: result.next});
    }
  }

  getMoreResults = () => {
    const { query, result } = this.props;
    if (!result.isLoading && result.next) {
      this.props.fetchQueryLogs({ query, next: result.next });
    }
  };

  render() {
    const { result, intl } = this.props;

    if(result.isError){
      return <ErrorSection visual="Unexpected error"/>
    }

    return (
      <React.Fragment>
        {result.total === 0
        && <ErrorSection
          visual="activity log"
          title={intl.formatMessage(messages.no_activity)}
        />}
        {result.total !== 0
        && <Timeline className="ActivityTimeline">
            {result.results.map((activity) =>
              <ActivityItem
                key={activity.text/*TODO: Find something unique as a key after other type arrive*/}
                activity={activity}
                type={
                  "search"
                  /*TODO: Identify item type dynamically in the feature when other activity types will arrive*/
                }
              />
            )}
          </Timeline>
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