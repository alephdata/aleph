import React, { Component } from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { debounce, isEqual, pick, pickBy, isArray } from 'lodash';
import { mergeWith } from 'lodash/fp'; // use fp version to not mutate the array

import { fetchSearchResults } from '../actions';
import filters from '../filters';

import SearchResultList from '../components/search/SearchResultList';
import SearchFilter from '../components/search/SearchFilter';

const defaultQuery = {
  'q': '',
  [filters.SCHEMA]: '',
  [filters.COUNTRIES]: [],
  [filters.COLLECTIONS]: []
}

function parseQuery(search) {
  const allParams = queryString.parse(search);
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
    const { query, searchResults } = this.props;
    return (
      <section>
        <SearchFilter result={searchResults} query={query} updateQuery={this.updateQuery} />
        <SearchResultList result={searchResults} />
      </section>
    )
  }
}

const mapStateToProps = ({ searchResults }, { location }) => {
  const query = parseQuery(location.search);
  return { query, searchResults };
}

SearchScreen = connect(
  mapStateToProps,
  { fetchSearchResults }
)(SearchScreen);

export default SearchScreen;
