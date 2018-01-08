import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { debounce } from 'lodash';

import Query from '../SearchScreen/Query';
import { fetchCollections } from 'src/actions';
import CollectionCard from './CollectionCard';

import './CollectionBrowser.css';

class CollectionBrowser extends Component {
  constructor() {
    super();

    this.state = {
      result: {results: []},
      isFetching: true
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
    let { query } = this.props;
    this.props.fetchCollections({
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
    const { result } = this.state;
    return (
      <div className="CollectionBrowser">
        {result.results.map(res =>
          <CollectionCard key={res.id} collection={res} />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    query: Query.fromLocation(ownProps.location, {}, 'co')
  };
}

CollectionBrowser = connect(mapStateToProps, { fetchCollections })(CollectionBrowser);
CollectionBrowser = withRouter(CollectionBrowser);
export default CollectionBrowser;
