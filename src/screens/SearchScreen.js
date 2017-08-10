import React, { Component } from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import queryString from 'query-string';

import { fetchSearchResults, filterSearchEntities } from '../actions/search';

import SearchResultList from '../components/SearchResultList';
import Search from '../components/Search';

const SearchWithRouter = withRouter(Search);

class SearchScreen extends Component {
  constructor() {
    super();
    this.changeEntityFilter = this.changeEntityFilter.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    // should account for multiple filters in the future
    if (this.props.query.q !== prevProps.query.q) {
      this.fetchData();
    }
  }

  fetchData() {
    const { query, fetchSearchResults } = this.props;
    fetchSearchResults(query);
  }

  changeEntityFilter(entityType) {
    this.props.filterSearchEntities(entityType);
  }

  render() {
    return (
      <div>
        <SearchWithRouter />
        <SearchResultList result={this.props.searchResults}
          changeEntityFilter={this.changeEntityFilter} />
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const params = queryString.parse(ownProps.location.search);

  return {
    query: params,
    searchResults: state.searchResults,
  };
}

SearchScreen = connect(
  mapStateToProps,
  { fetchSearchResults, filterSearchEntities }
)(SearchScreen);

export default SearchScreen;
