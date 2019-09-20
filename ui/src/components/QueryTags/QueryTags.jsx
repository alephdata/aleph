import React, { Component } from 'react';

import { FormattedMessage } from 'react-intl';
import { Button } from '@blueprintjs/core';
import QueryFilterTag from './QueryFilterTag';

class QueryTags extends Component {
  constructor(props) {
    super(props);
    this.removeFilterValue = this.removeFilterValue.bind(this);
    this.removeAllFilterValues = this.removeAllFilterValues.bind(this);
  }

  removeFilterValue(filter, value) {
    const { query, updateQuery } = this.props;
    updateQuery(query.removeFilter(filter, value));
  }

  removeAllFilterValues() {
    const { query, updateQuery } = this.props;
    updateQuery(query.removeAllFilters());
  }

  render() {
    const { query } = this.props;
    let activeFilters = query ? query.filters() : [];
    activeFilters = activeFilters.filter(filterName => filterName !== 'collection_id');

    if (activeFilters.length === 0) {
      return null;
    }

    const filterTags = activeFilters.map(filter => query.getFilter(filter).map(value => (
      <QueryFilterTag
        filter={filter}
        value={value}
        remove={this.removeFilterValue}
        key={value}
      />
    )));

    const showClearAll = filterTags.length > 1 || (filterTags[0] && filterTags[0].length > 1);

    // @FIXME This should still selectively display filters for the following:
    // "?exclude={id}"
    // "?parent.id={id}"
    // "?ancestors={id}"
    return (
      <div className="QueryTags">
        {filterTags}
        {showClearAll && (
          <Button
            className="filter-clear-tag bp3-tag bp3-large QueryFilterTag"
            onClick={this.removeAllFilterValues}
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
