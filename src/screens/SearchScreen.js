import React, { Component } from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { debounce, isEqual, pickBy, mergeWith, isArray } from 'lodash';

import { fetchSearchResults } from '../actions';
import filters from '../filters';

import SearchResultList from '../components/SearchResultList';
import SearchFilter from '../components/SearchFilter';

function parseQuery(search) {
  const searchQuery = queryString.parse(search);

  return mergeWith({
    'q': '',
    [filters.SCHEMA]: '',
    [filters.COUNTRIES]: [],
    [filters.COLLECTIONS]: []
  }, searchQuery, (defaultValue, newValue) => {
    return newValue !== undefined ?
      isArray(defaultValue) ? defaultValue.concat(newValue) : newValue :
      defaultValue;
  });
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
    fetchSearchResults(pickBy(query, v => !!v));
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
