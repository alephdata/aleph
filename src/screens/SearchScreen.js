import React, { Component } from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import queryString from 'query-string';

import { fetchSearchResults } from '../actions';

import DocumentList from '../components/DocumentList';
import Search from '../components/Search';

const SearchWithRouter = withRouter(Search);

class SearchScreen extends Component {
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

  render() {
    return (
      <div>
        <SearchWithRouter />
        <DocumentList result={this.props.searchResults} />
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const params = queryString.parse(ownProps.location.search);

  console.log(state);

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
