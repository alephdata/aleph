import React, { Component } from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { debounce, isEqual, pick, pickBy, isArray } from 'lodash';
import { mergeWith } from 'lodash/fp'; // use fp version to not mutate the array

import { fetchSearchResults } from 'actions';
import filters from 'constants/searchfilters';

import SearchResultList from './SearchResultList';
import SearchFilter from './SearchFilter';

const defaultQuery = {
  'q': '',
  [filters.SCHEMA]: '',
  [filters.COUNTRIES]: [],
  [filters.COLLECTIONS]: []
}

function parseQuery({ location, browsingContext }) {
  const allParams = queryString.parse(location.search);
  const relevantQueryParams = Object.keys(defaultQuery);
  const searchQuery = pick(allParams, relevantQueryParams);

  if (browsingContext.collectionId !== undefined) {
    if (searchQuery[filters.COLLECTIONS]) {
      console.warn('Got a collection filter while viewing a single collection. Ignoring the filter.');
    }
    searchQuery[filters.COLLECTIONS] = browsingContext.collectionId;
  }

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
    if (!isEqual(this.props.query, prevProps.query)) {
      this.fetchData();
    }
  }

  fetchData() {
    const { query, fetchSearchResults } = this.props;
    fetchSearchResults({
      ...pickBy(query, v => !!v),
      facet: 'schema'
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
  const query = parseQuery({ location, browsingContext });
  return { browsingContext, query, searchResults };
}

SearchScreen = connect(
  mapStateToProps,
  { fetchSearchResults }
)(SearchScreen);

export default SearchScreen;
