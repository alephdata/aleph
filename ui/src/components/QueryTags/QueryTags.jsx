import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';
import { Button } from '@blueprintjs/core';
import QueryFilterTag from './QueryFilterTag';

const HIDDEN_TAGS_CUTOFF = 10;

class QueryTags extends Component {
  constructor(props) {
    super(props);
    this.removeFilterValue = this.removeFilterValue.bind(this);
    this.removeAllFilterValues = this.removeAllFilterValues.bind(this);

    this.state = { showHidden: false };
  }

  removeFilterValue(filter, value) {
    const { query, updateQuery } = this.props;
    let newQuery;
    if (filter === 'eq:dates') {
      newQuery = query.removeFilter('gte:dates', value)
        .removeFilter('lte:dates', value);
    } else {
      newQuery = query.removeFilter(filter, value);
    }
    updateQuery(newQuery);
  }

  removeAllFilterValues() {
    const { query, updateQuery } = this.props;
    updateQuery(query.removeAllFilters());
  }

  render() {
    const { query } = this.props;
    const { showHidden } = this.state;

    let activeFilters = query ? query.filters() : [];

    if (activeFilters.length === 0) {
      return null;
    }

    let addlTags = [];
    if (query.hasFilter('gte:dates') && query.hasFilter('lte:dates')) {
      const gte = query.getFilter('gte:dates')[0];
      const lte = query.getFilter('lte:dates')[0];
      if (gte === lte) {
        activeFilters = activeFilters.filter(f => (f !== 'gte:dates' && f !== 'lte:dates'))
        addlTags.push({ filter: 'eq:dates', value: gte });
      }
    }

    const filterTags = _.flatten(
      activeFilters
        .map(filter => query.getFilter(filter).map(value => ({ filter, value })))
    );
    const allTags = [...filterTags, ...addlTags];
    const visibleTags = showHidden ? allTags : allTags.slice(0, HIDDEN_TAGS_CUTOFF);

    const showHiddenToggle = !showHidden && allTags.length > HIDDEN_TAGS_CUTOFF;
    const showClearAll = allTags.length > 1;

    // @FIXME This should still selectively display filters for the following:
    // "?exclude={id}"
    // "?parent.id={id}"
    // "?ancestors={id}"
    return (
      <div className="QueryTags">
        {visibleTags.map(({ filter, value }) => (
          <QueryFilterTag
            filter={filter}
            value={value}
            remove={this.removeFilterValue}
            key={value}
          />
        ))}
        {showHiddenToggle && (
          <Button
            className="filter-clear-tag bp3-tag bp3-large QueryFilterTag"
            onClick={() => this.setState({ showHidden: true })}
            outlined
          >
            <FormattedMessage
              id="queryFilters.showHidden"
              defaultMessage="Show {count} more filters..."
              values={{ count: allTags.length - visibleTags.length }}
            />
          </Button>
        )}
        {showClearAll && (
          <Button
            className="filter-clear-tag bp3-tag bp3-large QueryFilterTag"
            onClick={this.removeAllFilterValues}
            outlined
          >
            <FormattedMessage
              id="queryFilters.clearAll"
              defaultMessage="Clear all"
            />
          </Button>
        )}
      </div>
    );
  }
}

export default QueryTags;
