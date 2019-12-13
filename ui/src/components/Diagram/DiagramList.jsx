import React, { Component } from 'react';
import { Waypoint } from 'react-waypoint';
import DiagramListItem from 'src/components/Diagram/DiagramListItem';

import './DiagramList.scss';

class DiagramList extends Component {
  render() {
    const { getMoreItems, items } = this.props;

    return (
      <div className="DiagramList">
        <div className="DiagramList__items">
          {items.map(diagram => <DiagramListItem key={diagram.id} diagram={diagram} />)}
        </div>
        <Waypoint
          onEnter={getMoreItems}
          bottomOffset="-300px"
          scrollableAncestor={window}
        />
      </div>
    );
  }
}

export default DiagramList;
