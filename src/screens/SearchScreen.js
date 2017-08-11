import React, { Component } from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import queryString from 'query-string';
import isEqual from 'lodash/isEqual';

import { fetchSearchResults } from '../actions';

import SearchResultList from '../components/SearchResultList';
import SearchFilter from '../components/SearchFilter';

const SearchFilterWithRouter = withRouter(SearchFilter);

class SearchScreen extends Component {
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
    fetchSearchResults(query);
  }

  render() {
    return (
      <div>
        <SearchFilterWithRouter result={this.props.searchResults} />
        <SearchResultList result={this.props.searchResults} />
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const params = queryString.parse(ownProps.location.search);

  return {
    query: params,
    searchResults: state.searchResults
  };
}

SearchScreen = connect(
  mapStateToProps,
  { fetchSearchResults }
)(SearchScreen);

export default SearchScreen;
