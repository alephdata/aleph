import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Button, Intent } from '@blueprintjs/core';
import { ErrorSection, QueryInfiniteLoad } from 'components/common';
import { queryEntitySets } from 'actions';
import EntitySetIndexItem from 'components/EntitySet/EntitySetIndexItem';

import './EntitySetIndex.scss';

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
    const { intl, loadMoreOnScroll, onSelect, query, result, showCollection, type } = this.props;

    const isPending = result.isPending && !result.total;
    const skeletonItems = [...Array(8).keys()];
    const icon = type === 'diagram' ? 'graph' : 'list';
    const showLoadMoreButton = !loadMoreOnScroll && result.results && result.results.length < result.total;

    if (result.isError || result.total === 0) {
      return (
        <ErrorSection
          icon={icon}
          title={result.isError ? result.error.message : intl.formatMessage(messages[`no_${type}`])}
        />
      );
    }

    return (
      <div className="EntitySetIndex">
        <ul className="index">
          {result.results && result.results.map(entitySet => (
            <EntitySetIndexItem
              key={entitySet.id}
              entitySet={entitySet}
              showCollection={showCollection}
              onSelect={onSelect}
            />
          ))}
          {isPending && skeletonItems.map(item => (
            <EntitySetIndexItem
              key={item}
              showCollection={showCollection}
              onSelect={onSelect}
              isPending
            />
          ))}
        </ul>
        {loadMoreOnScroll && (
          <QueryInfiniteLoad
            query={query}
            result={result}
            fetch={this.props.queryEntitySets}
          />
        )}
        {showLoadMoreButton && (
          <Button
            minimal
            intent={Intent.PRIMARY}
            onClick={this.getMoreResults}
            className="EntitySetIndex__showMore"
          >
            <FormattedMessage
              id="entitysets.load_more"
              defaultMessage="Load more..."
            />
          </Button>
        )}

      </div>
    );
  }
}

export default compose(
  injectIntl,
  connect(null, { queryEntitySets }),
)(EntitySetIndex);
