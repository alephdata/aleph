import { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { fetchSearchResults } from 'src/actions';
import { selectResult } from 'src/selectors';

import Query from './Query';

class SearchContext extends Component {
  constructor(props) {
    super(props);

    this.updateQuery = this.updateQuery.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { result, query, fetchSearchResults } = this.props;

    if (result === undefined) {
      fetchSearchResults({ query });
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
      isFetching: result && result.isFetching,
      aspects: aspectsWithDefaults,
    };

    return children(searchContext);
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, context, prefix } = ownProps;

  // We normally only want Things, not Intervals (relations between things).
  const contextWithDefaults = {
    ...context,
    'filter:schemata': context['filter:schemata'] || 'Thing',
  };
  const query = Query.fromLocation(location, contextWithDefaults, prefix);

  const result = selectResult(state, query);

  return {
    query,
    result,
  };
};

SearchContext = connect(mapStateToProps, { fetchSearchResults })(SearchContext);
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
