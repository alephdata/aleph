import React, { Component } from 'react';
import { Waypoint } from 'react-waypoint';
import DiagramListItem from 'src/components/Diagram/DiagramListItem';

import './DiagramList.scss';

class DiagramList extends Component {
  render() {
    const { getMoreItems, isLoading, items, showCollection } = this.props;

    const skeletonItems = [...Array(10).keys()];


    console.log('items', items);

    if (isLoading) {
      return (
        <div className="DiagramList">
          <div className="DiagramList__items">
            {skeletonItems.map(item => (
              <DiagramListItem key={item} isLoading />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="DiagramList">
        <div className="DiagramList__items">
          {}
          {items.map(diagram => (
            <DiagramListItem key={diagram.id} diagram={diagram} showCollection={showCollection} />
          ))}
        </div>
        <Waypoint
          onEnter={getMoreItems}
          bottomOffset="0"
          scrollableAncestor={window}
        />
      </div>
    );
  }
}

export default DiagramList;
