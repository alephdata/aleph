import React from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';

import { collectionSearchQuery } from 'queries';
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
    const { collection, history } = this.props;

    history.push(
      getCollectionLink({
        collection,
        mode: collectionViewIds.SEARCH,
        search: newQuery.toLocation()
      })
    );
  }

  render() {
    const { className, datesQuery, datesResult } = this.props;
    const intervals = datesResult.facets?.dates?.intervals;

    if (!datesResult.isPending && (!intervals || intervals.length <= 1)) {
      return null;
    }

    return (
      <div className={className}>
        <div className={c({ [Classes.SKELETON]: datesResult.isPending })}>
          <DateFacet
            isOpen={true}
            intervals={intervals}
            query={datesQuery}
            field="dates"
            updateQuery={this.onDateIntervalSelect}
          />
        </div>
      </div>
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
