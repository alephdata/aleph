import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { EntitySet, ErrorSection, QueryInfiniteLoad } from 'components/common';
import { queryEntitySets } from 'actions';
import EntitySetIndexItem from 'components/EntitySet/EntitySetIndexItem';

const messages = defineMessages({
  no_diagram: {
    id: 'diagrams.no_diagrams',
    defaultMessage: 'There are no network diagrams.',
  },
  no_list: {
    id: 'lists.no_lists',
    defaultMessage: 'There are no lists.',
  },
  no_timeline: {
    id: 'timelines.no_timelines',
    defaultMessage: 'There are no timelines.',
  },
});

class EntitySetIndex extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryEntitySets({ query });
    }
  }

  render() {
    const {
      intl,
      loadOnScroll,
      onSelect,
      query,
      result,
      showCollection,
      type,
    } = this.props;

    const isPending = result.isPending && !result.total;
    const skeletonItems = [...Array(8).keys()];

    if (result.isError) {
      return <ErrorSection error={result.error} />;
    }

    if (result.total === 0) {
      return (
        <ErrorSection
          icon={<EntitySet.Icon entitySet={{ type }} iconSize={60} />}
          title={intl.formatMessage(messages[`no_${type}`])}
        />
      );
    }

    return (
      <div className="EntitySetIndex">
        <ul className="index">
          {result.results &&
            result.results.map((entitySet) => (
              <EntitySetIndexItem
                key={entitySet.id}
                entitySet={entitySet}
                showCollection={showCollection}
                onSelect={onSelect}
              />
            ))}
          {isPending &&
            skeletonItems.map((item) => (
              <EntitySetIndexItem
                key={item}
                showCollection={showCollection}
                onSelect={onSelect}
                isPending
              />
            ))}
        </ul>
        <QueryInfiniteLoad
          query={query}
          result={result}
          fetch={this.props.queryEntitySets}
          loadOnScroll={loadOnScroll}
        />
      </div>
    );
  }
}

export default compose(
  injectIntl,
  connect(null, { queryEntitySets })
)(EntitySetIndex);
