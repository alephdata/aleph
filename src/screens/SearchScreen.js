import React, { Component } from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { debounce, isEqual, pickBy } from 'lodash';

import { fetchSearchResults } from '../actions';

import SearchResultList from '../components/SearchResultList';
import SearchFilter from '../components/SearchFilter';

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
    fetchSearchResults(query);
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;

    history.push({
      pathname: location.pathname,
      search: queryString.stringify(pickBy(newQuery, v => !!v))
    });
  }

  render() {
    return (
      <div>
        <SearchFilter result={this.props.searchResults} query={this.props.query}
          updateQuery={this.updateQuery} />
        <SearchResultList result={this.props.searchResults} />
      </div>
    )
  }
}

const mapStateToProps = ({ searchResults }, { location }) => {
  const query = queryString.parse(location.search);
  return { query, searchResults };
}

SearchScreen = connect(
  mapStateToProps,
  { fetchSearchResults }
)(SearchScreen);

export default SearchScreen;
