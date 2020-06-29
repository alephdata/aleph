import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Waypoint } from 'react-waypoint';
import { ErrorSection } from 'src/components/common';
import DiagramListItem from 'src/components/Diagram/DiagramListItem';

import './DiagramList.scss';

const messages = defineMessages({
  no_diagrams: {
    id: 'diagrams.no_diagrams',
    defaultMessage: 'There are no network diagrams.',
  },
});

class DiagramList extends Component {
  render() {
    const { getMoreItems, intl, result, showCollection } = this.props;

    const isPending = result.isPending && !result.total;
    const skeletonItems = [...Array(8).keys()];

    if (result.total === 0) {
      return (
        <ErrorSection
          icon="graph"
          title={intl.formatMessage(messages.no_diagrams)}
        />
      );
    }

    return (
      <div className="DiagramList">
        <div className="DiagramList__items">
          {result.results && result.results.map(diagram => (
            <DiagramListItem key={diagram.id} diagram={diagram} showCollection={showCollection} />
          ))}
          {isPending && skeletonItems.map(item => (
            <DiagramListItem key={item} showCollection={showCollection} isPending />
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

export default injectIntl(DiagramList);
