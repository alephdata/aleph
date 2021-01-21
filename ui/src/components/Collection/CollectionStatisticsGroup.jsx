import React from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';

import { Skeleton } from 'components/common';
import CollectionStatistics from './CollectionStatistics';
import { selectCollection } from 'selectors';

import './CollectionStatisticsGroup.scss';

const statFields = [
  'schema', 'countries', 'names', 'emails', 'addresses', 'ibans', 'phones',
];

class CollectionStatisticsGroup extends React.Component {
  renderStatisticsItem({ key, total, values }) {
    const { collectionId } = this.props;
    return (
      <div className="CollectionStatisticsGroup__item" key={key}>
        <CollectionStatistics
          collectionId={collectionId}
          field={key}
          values={values}
          total={total}
        />
      </div>
    );
  }

  render() {
    const { emptyComponent, isPending, statsToRender } = this.props;

    if (isPending) {
      return <Skeleton.Layout type="multi-column" colCount={3} />;
    }

    if (!statsToRender.length) {
      return emptyComponent;
    }

    return (
      <div className="CollectionStatisticsGroup">
        {statsToRender.map((stat) => this.renderStatisticsItem(stat))}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps;
  const collection = selectCollection(state, collectionId);
  if (!collection.id && collection.isPending) { return { isPending: true } }

  const { statistics = {} } = collection;

  const statsToRender = statFields.map(key => ({ key, ...statistics[key] }))
    .filter(stat => stat && stat.total);

  return { statsToRender };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionStatisticsGroup);
