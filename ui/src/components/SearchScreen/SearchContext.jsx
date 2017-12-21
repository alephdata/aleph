import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { debounce, isEqual, pick, pickBy, isArray } from 'lodash';
import { mergeWith } from 'lodash/fp'; // use fp version to not mutate the array

import { fetchSearchResults } from 'src/actions';

import Query from './Query';
import SearchResult from './SearchResult';
import SearchFilter from './SearchFilter';


class SearchContext extends Component {
  constructor() {
    super();

    this.state = {
      result: {isFetching: true}
    };

    this.fetchData = debounce(this.fetchData, 200);
    this.updateQuery = this.updateQuery.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchData();
    }
  }

  fetchData() {
    let { query, fetchSearchResults } = this.props;
    this.setState({isFetching: true})

    // If we are viewing a single collection, add the appropriate filter.
    // const performedQuery = { ...query };
    // if (browsingContext.collectionId !== undefined) {
    //   if (performedQuery['filter:collection_id']) {
    //     console.warn('Got a collection filter while viewing a single collection. Ignoring the filter.');
    //   }
    //   performedQuery['filter:collection_id'] = browsingContext.collectionId;
    // }

    console.log(query.toParams());

    fetchSearchResults({
      filters: query.toParams(),
    }).then(({result}) => {
      this.setState({result, isFetching: false})
    });
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation()
    });
  }

  render() {
    const { query, children } = this.props;
    const { result, isFetching } = this.state;

    return (
      <div className="SearchContext">
        <SearchFilter query={query} result={result} updateQuery={this.updateQuery} />
        <SearchResult query={query} result={result} /> 
      </div>
    )
  }
}

const mapStateToProps = (ownProps, { location }) => {
  return {
    query: ownProps.query || Query.fromLocation(location, ownProps.prefix)
  };
}

SearchContext = connect(mapStateToProps, { fetchSearchResults })(SearchContext);
SearchContext = withRouter(SearchContext);
export default SearchContext;
