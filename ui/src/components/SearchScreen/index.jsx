import React, { Component } from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { debounce, isEqual, pick, pickBy, isArray } from 'lodash';
import { mergeWith } from 'lodash/fp'; // use fp version to not mutate the array

import { fetchSearchResults } from 'src/actions';
import filters from 'src/constants/searchfilters';

import SearchResultList from './SearchResultList';
import SearchFilter from './SearchFilter';

const defaultQuery = {
  'q': '',
  [filters.SCHEMA]: '',
  [filters.COUNTRIES]: [],
  [filters.COLLECTIONS]: []
}

function parseQuery(location) {
  const allParams = queryString.parse(location.search);
  const relevantQueryParams = Object.keys(defaultQuery);
  const searchQuery = pick(allParams, relevantQueryParams);

  return mergeWith((defaultValue, newValue) => {
    return newValue !== undefined
      ? isArray(defaultValue)
        ? defaultValue.concat(newValue)
        : newValue
      : defaultValue;
  }, defaultQuery, searchQuery);
}

class SearchScreen extends Component {
  constructor() {
    super();

    this.fetchData = debounce(this.fetchData, 200);
    this.updateQuery = this.updateQuery.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (
      !isEqual(this.props.query, prevProps.query) ||
      !isEqual(this.props.browsingContext, prevProps.browsingContext)
    ) {
      this.fetchData();
    }
  }

  fetchData() {
    const { browsingContext, query, fetchSearchResults } = this.props;

    // If we are viewing a single collection, add the appropriate filter.
    const performedQuery = { ...query };
    if (browsingContext.collectionId !== undefined) {
      if (performedQuery[filters.COLLECTIONS]) {
        console.warn('Got a collection filter while viewing a single collection. Ignoring the filter.');
      }
      performedQuery[filters.COLLECTIONS] = browsingContext.collectionId;
    }

    fetchSearchResults({
      filters: {
        ...pickBy(performedQuery, v => !!v),
        facet: 'schema'
      },
    });
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;

    history.push({
      pathname: location.pathname,
      search: queryString.stringify(pickBy(newQuery, v => !!v))
    });
  }

  render() {
    const { browsingContext, query, searchResults } = this.props;
    return (
      <section>
        <SearchFilter
          result={searchResults}
          query={query}
          updateQuery={this.updateQuery}
          browsingContext={browsingContext}
        />
        <SearchResultList result={searchResults} />
      </section>
    )
  }
}

const mapStateToProps = ({ searchResults }, { location, match }) => {
  const browsingContext = match.params;
  const query = parseQuery(location);
  return { browsingContext, query, searchResults };
}

SearchScreen = connect(
  mapStateToProps,
  { fetchSearchResults }
)(SearchScreen);

export default SearchScreen;
