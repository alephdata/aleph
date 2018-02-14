import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { isBoolean, debounce } from 'lodash';
import { Helmet } from 'react-helmet';

import { fetchSearchResults } from 'src/actions';

import Query from './Query';
import SearchResult from './SearchResult';
import SearchFilter from './filter/SearchFilter';
import SectionLoading from 'src/components/common/SectionLoading';


class SearchContext extends Component {
  constructor(props) {
    super(props);

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
    this.setState({isFetching: true})
    let { query, fetchSearchResults } = this.props;
    query = query.setFilter('schemata', 'Thing');

    fetchSearchResults({
      filters: query.toParams(),
    }).then(({result}) => {
      this.setState({result, isFetching: false})
    });
  }

  updateQuery(newQuery, { replace = false } = {}) {
    const { history, location } = this.props;
    const navigate = replace ? history.replace : history.push;
    navigate({
      pathname: location.pathname,
      search: newQuery.toLocation()
    });
  }

  render() {
    const { query, aspects = {} } = this.props;
    const { result, isFetching } = this.state;

    aspects.filter = isBoolean(aspects.filter) ? aspects.filter : true;
    aspects.collections = isBoolean(aspects.collections) ? aspects.collections : true;
    aspects.countries = isBoolean(aspects.countries) ? aspects.countries : true;

    return (
      <div className="SearchContext">
        {query.hasQuery() && (
          <Helmet>
            <title>{query.getQ()}</title>
          </Helmet>
        )}
        
        { aspects.filter && (
          <SearchFilter query={query}
                        aspects={aspects}
                        updateQuery={this.updateQuery} />
        )}
        <SearchResult query={query}
                      result={result}
                      aspects={aspects}
                      updateQuery={this.updateQuery} />
        { isFetching && (
          <SectionLoading />
        )}
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
