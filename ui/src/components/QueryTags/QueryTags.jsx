import React, { Component } from 'react';

import QueryFilterTag from './QueryFilterTag';

class QueryTags extends Component {
  constructor(props) {
    super(props);
    this.removeFilterValue = this.removeFilterValue.bind(this);
  }

  removeFilterValue(filter, value) {
    const { query, updateQuery } = this.props;
    updateQuery(query.removeFilter(filter, value));
  }

  render() {
    const { query } = this.props;
    const activeFilters = query ? query.filters() : [];
    if (activeFilters.length === 0) {
      return null;
    }

    // @FIXME This should still selectively display filters for the following:
    // "?exclude={id}"
    // "?parent.id={id}"
    // "?ancestors={id}"
    return (
      <div className="QueryTags">
        {activeFilters.map(filter => query.getFilter(filter).map(value => (
          <QueryFilterTag
            filter={filter}
            value={value}
            remove={this.removeFilterValue}
            key={value}
          />
        )))}
      </div>
    );
  }
}

export default QueryTags;
