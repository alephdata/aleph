import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { debounce } from 'lodash';

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
    let changed = !this.props.query.sameAs(prevProps.query);
    changed = changed || this.props.parent !== prevProps.parent;
    changed = changed || this.props.collection !== prevProps.collection;
    if (changed) {
      this.fetchData();
    }
  }

  fetchData() {
    this.setState({isFetching: true})
    let { query, fetchSearchResults } = this.props;
    query = query.addFacet('schema');
    query = query.setFilter('schemata', 'Thing');

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
    const { query, collection, parent } = this.props;
    const { result } = this.state;
    const showCollection = !collection;
    const showCountry = !parent;

    return (
      <div className="SearchContext">
        <SearchFilter query={query}
                      result={result}
                      showCountry={showCountry}
                      showCollection={showCollection}
                      updateQuery={this.updateQuery} />
        <SearchResult query={query}
                      result={result}
                      showCountry={showCountry}
                      showCollection={showCollection} />
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const context = ownProps.context || {};
  const location = ownProps.location;
  return {
    query: Query.fromLocation(location, context, ownProps.prefix)
  };
}

SearchContext = connect(mapStateToProps, { fetchSearchResults })(SearchContext);
SearchContext = withRouter(SearchContext);
export default SearchContext;
