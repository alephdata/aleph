import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Waypoint } from 'react-waypoint';
import { ErrorSection } from 'src/components/common';
import EntitySetListItem from 'src/components/EntitySet/EntitySetListItem';

import './EntitySetList.scss';

const messages = defineMessages({
  empty: {
    id: 'entitysets.empty',
    defaultMessage: 'There are no {type}s.',
  },
});

class EntitySetList extends Component {
  render() {
    const { getMoreItems, intl, result, showCollection, type } = this.props;

    const isPending = result.isPending && !result.total;
    const skeletonItems = [...Array(8).keys()];

    if (result.total === 0) {
      return (
        <ErrorSection
          icon="graph"
          title={intl.formatMessage(messages.empty, { type })}
        />
      );
    }

    return (
      <div className="EntitySetList">
        <div className="EntitySetList__items">
          {result.results && result.results.map(entitySet => (
            <EntitySetListItem key={entitySet.id} entitySet={entitySet} showCollection={showCollection} />
          ))}
          {isPending && skeletonItems.map(item => (
            <EntitySetListItem key={item} showCollection={showCollection} isPending />
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

export default injectIntl(EntitySetList);
