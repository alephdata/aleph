import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Waypoint } from 'react-waypoint';
import { ErrorSection } from 'components/common';
import EntitySetListItem from 'components/EntitySet/EntitySetListItem';

import './EntitySetList.scss';

const messages = defineMessages({
  no_diagram: {
    id: 'diagrams.no_diagrams',
    defaultMessage: 'There are no network diagrams.',
  },
  no_list: {
    id: 'lists.no_lists',
    defaultMessage: 'There are no lists.',
  },
});

class EntitySetList extends Component {
  render() {
    const { getMoreItems, intl, result, showCollection, type } = this.props;

    const isPending = result.isPending && !result.total;
    const skeletonItems = [...Array(8).keys()];
    const icon = type === 'diagram' ? 'graph' : 'list';

    if (result.total === 0) {
      return (
        <ErrorSection
          icon={icon}
          title={intl.formatMessage(messages[`no_${type}`])}
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
