import React, {Component} from 'react';
import ActivitySearch from "./ActivityItems/ActivitySearch";


class ActivityItem extends Component {

  TYPE_TO_COMPONENT = {
    search: ActivitySearch
  };

  state = {
    itemComponents : {}
  };

  render(){
    const CurrentItem = this.TYPE_TO_COMPONENT[this.props.type];
    return <CurrentItem
      {...this.props}
    />
  }
}

export default ActivityItem;
