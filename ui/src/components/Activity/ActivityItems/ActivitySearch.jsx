import React, {PureComponent} from 'react';
import { defineMessages, injectIntl } from 'react-intl';

import {TimelineEvent} from 'react-event-timeline';
import { Button, AnchorButton } from '@blueprintjs/core/lib/esm/components/button/buttons';
import { Position } from '@blueprintjs/core/lib/esm/common/position';
import { Tooltip } from '@blueprintjs/core/lib/esm/components/tooltip/tooltip';
import Date from "../../common/Date";
import SearchAlert from "../../SearchAlert/SearchAlert";

const messages = defineMessages({
  AS_ASD: {
    id:'as.asd',
    defaultMessage: 'asd'
  },
  remove_item: {
    id:'activity.searchItem.remove_item',
    defaultMessage:"Remove search from history"
  },
  repeat_item: {
    id:'activity.searchItem.repeat_item',
    defaultMessage:"Redo search"
  },
  search_label: {
    id:'activity.searchItem.search_label',
    defaultMessage: "You searched for"
  }
})

class ActivitySearch extends PureComponent {
  state = {
    isButtonsVisible: false
  };

  onMouseOver = () => this.setState({ isButtonsVisible : true });

  onMouseLeave = () => this.setState({ isButtonsVisible : false });

  render(){
    const {activity, intl} = this.props;

    return <TimelineEvent
      onMouseOver={this.onMouseOver}
      onMouseLeave={this.onMouseLeave}
      createdAt={<Date value={activity.created_at}/>}
      icon={<span className="pt-icon pt-icon-search"/>}
      contentStyle={{
        lineHeight:'25px',
      }}
      bubbleStyle={{
        borderColor:'#5c7080'
      }}
    >
      <span>
        {intl.formatMessage(messages.search_label)}
        <Tooltip content={intl.formatMessage(messages.repeat_item)} position={Position.RIGHT}>
          <AnchorButton href={`search?q=${activity.text}`} minimal rightIcon="share" small>
            <b>{activity.text}</b>
          </AnchorButton>
        </Tooltip>
      </span>
        <Tooltip content={intl.formatMessage(messages.remove_item)} position={Position.RIGHT}>
          <Button rightIcon="trash" minimal />
        </Tooltip>
        <SearchAlert queryText={activity.text}/>
    </TimelineEvent>
  }
}

export default injectIntl(ActivitySearch);
