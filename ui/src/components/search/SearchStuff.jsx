import { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { debounce } from 'lodash';

import { fetchSearchResults } from 'src/actions';

import Query from './Query';


class SearchStuff extends Component {
  static propTypes = {
    children: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      result: {},
      isFetching: false,
    };

    this.fetchData = debounce(this.fetchData, 200);
    this.updateQuery = this.updateQuery.bind(this);
    this.getQuery = this.getQuery.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (!this.getQuery().sameAs(this.getQuery(prevProps))) {
      this.fetchData();
    }
  }

  fetchData() {
    this.setState({isFetching: true});
    const { fetchSearchResults } = this.props;
    let query = this.getQuery();
    query = query.setFilter('schemata', 'Thing');

    fetchSearchResults({
      filters: query.toParams(),
    }).then(({result}) => {
      this.setState({result, isFetching: false})
    });
  }

  getQuery(props = this.props) {
    const { location, context, prefix } = props;
    return Query.fromLocation(location, context, prefix);
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
    const { children, aspects } = this.props;
    const { result, isFetching } = this.state;

    // Default some aspects to true
    const aspectsWithDefaults = {
      filter: true,
      collections: true,
      countries: true,
      ...aspects
    };

    // XXX: A shallow prop comparison by WrappedComponent would always
    // consider searchStuff to have changed. Should we cache it in our state?
    const searchStuff = {
      query: this.getQuery(),
      updateQuery: this.updateQuery,
      result,
      isFetching,
      aspects: aspectsWithDefaults,
    };

    return children(searchStuff);
  }
}

SearchStuff = connect(null, { fetchSearchResults })(SearchStuff);
SearchStuff = withRouter(SearchStuff);

export default SearchStuff;
