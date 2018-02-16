import { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { debounce } from 'lodash';

import { fetchSearchResults } from 'src/actions';

import Query from './Query';


class SearchContext extends Component {
  constructor(props) {
    super(props);

    this.state = {
      result: {},
      isFetching: false,
    };

    this.fetchData = debounce(this.fetchData, 200);
    this.updateQuery = this.updateQuery.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    const { query } = this.props;

    if (!query.sameAs(prevProps.query)) {
      this.fetchData();
    }
  }

  fetchData() {
    this.setState({isFetching: true});
    const { query, fetchSearchResults } = this.props;

    fetchSearchResults({
      query,
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
    const { query, aspects, children } = this.props;
    const { result, isFetching } = this.state;

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
      isFetching,
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

  return {
    query,
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
