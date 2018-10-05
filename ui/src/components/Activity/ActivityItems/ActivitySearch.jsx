import React, {PureComponent} from 'react';
import Link from 'react-router-dom/Link'
import {connect} from 'react-redux';
import {defineMessages, injectIntl} from 'react-intl';
import {TimelineEvent} from 'react-event-timeline';
import {Button, AnchorButton} from '@blueprintjs/core/lib/esm/components/button/buttons';
import {Position} from '@blueprintjs/core/lib/esm/common/position';
import {Tooltip} from '@blueprintjs/core/lib/esm/components/tooltip/tooltip';
import Date from "src/components/common/Date";
import SearchAlert from "src/components/SearchAlert/SearchAlert";
import {deleteQueryLog} from "src/actions/queryLogsActions";

import './ActivitySearch.css'

const messages = defineMessages({
  remove_item: {
    id:'activity.searchItem.remove_item',
    defaultMessage:"Remove search from history"
  },
  repeat_item: {
    id:'activity.searchItem.repeat_item',
    defaultMessage:"Search"
  },
  search_label: {
    id:'activity.searchItem.search_label',
    defaultMessage: "You searched for"
  }
});

class ActivitySearch extends PureComponent {

  render(){
    const {activity, intl} = this.props;

    return <TimelineEvent
      title={<Date value={activity.created_at}/>}
      icon={<span className="pt-icon pt-icon-search"/>}
      bubbleStyle={{ borderColor:'#5c7080' }}
      className="activity-search"
    >
      <div className="activity-search--content">
        <div className="activity-search--term">
          <span>{intl.formatMessage(messages.search_label)}</span>
          <span> <Link to={`/search?q=${activity.text}`}><b>{activity.text}</b></Link></span>
        </div>
        <div className="activity-search--actions">
          <Tooltip content={intl.formatMessage(messages.repeat_item)} position={Position.RIGHT}>
            <AnchorButton target="_blank" href={`/search?q=${activity.text}`} minimal rightIcon="share" />
          </Tooltip>
          <SearchAlert queryText={activity.text}/>
          <Tooltip content={intl.formatMessage(messages.remove_item)} position={Position.RIGHT}>
            <Button
              rightIcon="trash"
              minimal
              onClick={this.props.deleteQueryLog}
            />
          </Tooltip>
        </div>
      </div>
    </TimelineEvent>
  }
}

const mapStateToProps =() => ({});
const mapDispatchToProps = (dispatch, {activity}) => ({
  deleteQueryLog: () => dispatch(deleteQueryLog(activity))
});
export default connect(mapStateToProps, mapDispatchToProps)(
  injectIntl(ActivitySearch)
);
