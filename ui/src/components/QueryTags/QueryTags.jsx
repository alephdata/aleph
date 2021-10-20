import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';

import { Button } from '@blueprintjs/core';
import QueryFilterTag from './QueryFilterTag';
import { cleanDateQParam } from 'components/Facet/util';

const HIDDEN_TAGS_CUTOFF = 10;

class QueryTags extends Component {
  constructor(props) {
    super(props);
    this.removeFilterValue = this.removeFilterValue.bind(this);
    this.removeAllFilterValues = this.removeAllFilterValues.bind(this);

    this.state = { showHidden: false };
  }

  removeFilterValue(filter, type, value) {
    const { query, updateQuery } = this.props;
    let newQuery;

    if (type === 'date') {
      newQuery = query.clearFilter(`gte:${filter}`)
        .clearFilter(`lte:${filter}`)
        .set(`facet_interval:${filter}`, 'year')
    } else {
      newQuery = query.removeFilter(filter, value);
    }

    updateQuery(newQuery);
  }

  removeAllFilterValues() {
    const { query, updateQuery } = this.props;
    updateQuery(query.removeAllFilters());
  }

  getTagsList(tagsList) {
    const { query } = this.props;

    const tags = _.flatten(
      query.filters()
        .map(filter => query.getFilter(filter).map(value => ({ filter, value, type: query.getFacetType(filter) })))
    );

    const [dateTags, otherTags] = _.partition(tags, tag => tag.filter.includes(":"));
    const dateProps = _.groupBy(dateTags, tag => tag.filter.split(':')[1])

    const processedDateTags = Object.entries(dateProps).map(([propName, values]) => {
      const gt = cleanDateQParam(values.find(({ filter }) => filter.includes('gte'))?.value)
      const lt = cleanDateQParam(values.find(({ filter }) => filter.includes('lte'))?.value)

      if (!gt || !lt) { return null; }
      const combinedValue = gt === lt ? gt : `${gt} - ${lt}`

      return ({ filter: propName, value: combinedValue, type: 'date' })
    })

    return [...processedDateTags, ...otherTags];
  }

  render() {
    const { query } = this.props;
    const { showHidden } = this.state;

    if (!query || query.filters().length === 0) {
      return null;
    }

    const filterTags = this.getTagsList();
    const visibleTags = showHidden ? filterTags : filterTags.slice(0, HIDDEN_TAGS_CUTOFF);

    const showHiddenToggle = !showHidden && filterTags.length > HIDDEN_TAGS_CUTOFF;
    const showClearAll = filterTags.length > 1;

    // @FIXME This should still selectively display filters for the following:
    // "?exclude={id}"
    // "?parent.id={id}"
    // "?ancestors={id}"
    return (
      <div className="QueryTags">
        {visibleTags.map(({ filter, type, value }) => (
          <QueryFilterTag
            query={query}
            filter={filter}
            type={type}
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
              values={{ count: filterTags.length - visibleTags.length }}
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
