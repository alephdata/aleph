import React, { Component } from 'react';
import { Waypoint } from 'react-waypoint';
import DiagramListItem from 'src/components/Diagram/DiagramListItem';

import './DiagramList.scss';

class DiagramList extends Component {
  render() {
    const { getMoreItems, result, showCollection } = this.props;

    const isLoading = result.isLoading || result.shouldLoad;
    const skeletonItems = [...Array(9).keys()];

    return (
      <div className="DiagramList">
        <div className="DiagramList__items">
          {result.results && result.results.map(diagram => (
            <DiagramListItem key={diagram.id} diagram={diagram} showCollection={showCollection} />
          ))}
          {isLoading && skeletonItems.map(item => (
            <DiagramListItem key={item} showCollection={showCollection} isLoading />
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
