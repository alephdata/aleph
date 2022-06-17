// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';
import moment from 'moment';

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

    // combines "greater than" and "less than" filters into a single tag
    const processedDateTags = Object.entries(dateProps).map(([propName, values]) => {
      const gt = cleanDateQParam(values.find(({ filter }) => filter.includes('gte'))?.value)
      const lt = cleanDateQParam(values.find(({ filter }) => filter.includes('lte'))?.value)
      let combinedValue;
      if (!gt || !lt) {
        return null;
      } else if (gt === lt) {
        combinedValue = gt
      // if timespan between greater than and less than is exactly a year, displays year in query tag
      } else if (moment.utc(gt).month() === 0 && moment.utc(lt).month() === 11) {
        combinedValue = moment.utc(gt).year()
      } else if (moment.utc(gt).isSame(moment.utc(gt).startOf('month'), 'day') && moment.utc(lt).isSame(moment.utc(lt).endOf('month'), 'day')) {
        combinedValue = moment.utc(gt).format('yyyy-MM')
      } else {
        combinedValue = `${gt} - ${lt}`
      }

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
