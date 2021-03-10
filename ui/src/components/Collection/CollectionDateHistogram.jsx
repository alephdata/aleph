import React from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Histogram } from '@alephdata/react-ftm';

import { collectionSearchQuery } from 'queries'
import CollectionStatistics from './CollectionStatistics';
import { selectCollection, selectEntitiesResult } from 'selectors';
import { queryEntities } from 'actions';
import DateFacet from 'components/Facet/DateFacet';
import getCollectionLink from 'util/getCollectionLink';
import collectionViewIds from 'components/Collection/collectionViewIds';

class CollectionDateHistogram extends React.Component {
  constructor(props) {
    super(props);
    this.onDateIntervalSelect = this.onDateIntervalSelect.bind(this);
  }

  componentDidMount() {
    this.fetchDatesIfNeeded()
  }

  componentDidUpdate() {
    this.fetchDatesIfNeeded()
  }

  fetchDatesIfNeeded() {
    const { datesQuery, datesResult } = this.props;

    if (datesResult.shouldLoad) {
      this.props.queryEntities({ query: datesQuery });
    }
  }

  onDateIntervalSelect(newQuery) {
    const { collection, history, location } = this.props;

    history.push(
      getCollectionLink({
        collection,
        mode: collectionViewIds.SEARCH,
        search: newQuery.toLocation()
      })
    );
  }

  render() {
    const { datesQuery, datesResult, statsToRender } = this.props;

    return (
      <DateFacet
        isOpen={true}
        intervals={datesResult?.facets?.dates?.intervals}
        query={datesQuery}
        updateQuery={this.onDateIntervalSelect}
      />
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId, location } = ownProps;
  const collection = selectCollection(state, collectionId);

  const datesQuery = collectionSearchQuery(location, collectionId)
    .add('facet', 'dates')
    .add('facet_interval:dates', 'year');

  return {
    collection,
    datesQuery,
    datesResult: selectEntitiesResult(state, datesQuery),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntities }),
)(CollectionDateHistogram);
