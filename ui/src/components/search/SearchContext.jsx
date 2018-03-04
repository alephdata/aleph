import { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { queryEntities } from 'src/actions';
import { selectEntitiesResult } from 'src/selectors';

import Query from 'src/app/Query';

class SearchContext extends Component {
  constructor(props) {
    super(props);

    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    // Check for a change of query, as unconditionally calling fetchIfNeeded
    // could cause an infinite loop (if fetching fails).
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchIfNeeded();
    }
  }

  fetchIfNeeded() {
    const { result, query, queryEntities } = this.props;

    if (result.pages === undefined || (result.status === 'error')) {
      queryEntities({ query: query });
    }
  }

  getMoreResults() {
    const { query, result, queryEntities } = this.props;

    if (result && result.next) {
      queryEntities({ query, next: result.next });
    }
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
    const { query, aspects, children, result } = this.props;

    // Default some aspects to true
    const aspectsWithDefaults = {
      filter: true,
      collections: true,
      countries: true,
      ...aspects
    };

    // XXX: A shallow prop comparison by WrappedComponent would always
    // consider searchContext to have changed. Should we cache it in our state?
    const searchContext = {
      query,
      updateQuery: this.updateQuery,
      result,
      getMoreResults: this.getMoreResults,
      aspects: aspectsWithDefaults,
    };

    return children(searchContext);
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, context, prefix } = ownProps;

  // We normally only want Things, not Intervals (relations between things).
  const contextWithDefaults = {
    'filter:schemata': context['filter:schemata'] || 'Thing',
    'limit': 50,
    ...context,
  };
  const query = Query.fromLocation('search', location, contextWithDefaults, prefix);
  const result = selectEntitiesResult(state, query);

  return {
    query,
    result,
  };
};

SearchContext = connect(mapStateToProps, { queryEntities })(SearchContext);
SearchContext = withRouter(SearchContext);

SearchContext.propTypes = {
  children: PropTypes.func.isRequired,
  context: PropTypes.object,
  aspects: PropTypes.object,
  prefix: PropTypes.string,
};

SearchContext.defaultProps = {
  context: {},
  aspects: {}, // XXX we set individual aspects' defaults in render()
  prefix: '',
};

export default SearchContext;
