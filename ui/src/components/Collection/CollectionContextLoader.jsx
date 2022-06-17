// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter'
import { collectionXrefFacetsQuery } from 'queries';
import { fetchCollection, queryCollectionXref, forceMutate } from 'actions';
import { selectCollection, selectCollectionXrefResult } from 'selectors';
import timestamp from 'util/timestamp';


class CollectionContextLoader extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { timeout: null };
    this.fetchRefresh = this.fetchRefresh.bind(this);
  }

  componentDidMount() {
    this.fetchRefresh();
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  componentWillUnmount() {
    clearTimeout(this.state.timeout);
  }

  fetchIfNeeded() {
    const { collectionId, collection } = this.props;

    if (collection.shouldLoadDeep) {
      const refresh = collection.shallow === false;
      this.props.fetchCollection({ id: collectionId, refresh });
    }

    const { xrefResult, xrefQuery } = this.props;
    if (xrefResult.shouldLoad) {
      this.props.queryCollectionXref({ query: xrefQuery, result: xrefResult });
    }
  }

  fetchRefresh() {
    const { collection } = this.props;
    const { status } = collection;
    clearTimeout(this.state.timeout);
    const staleDuration = status.active ? 3000 : 30000;
    const age = timestamp() - collection.loadedAt;
    const shouldRefresh = (age > staleDuration) && !collection.isPending;
    if (shouldRefresh) {
      // this.props.forceMutate();
      this.props.fetchCollection(collection);
    }
    const timeout = setTimeout(this.fetchRefresh, 1000);
    this.setState({ timeout });
  }

  render() {
    return this.props.children;
  }
}


const mapStateToProps = (state, ownProps) => {
  const { location, collectionId } = ownProps;
  const xrefQuery = collectionXrefFacetsQuery(location, collectionId);
  return {
    collection: selectCollection(state, collectionId),
    xrefQuery,
    xrefResult: selectCollectionXrefResult(state, xrefQuery),
  };
};

const mapDispatchToProps = {
  forceMutate,
  fetchCollection,
  queryCollectionXref
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(CollectionContextLoader);
