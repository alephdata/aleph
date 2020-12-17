import React from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import { Skeleton } from 'components/common';
import CollectionStatistics from './CollectionStatistics';

import './CollectionStatisticsGroup.scss';

const statFields = [
  'schema', 'countries', 'names', 'emails', 'addresses', 'ibans', 'phones',
];

class CollectionStatisticsGroup extends React.Component {
  renderStatisticsItem({ key, total, values }) {
    const { collection } = this.props;
    return (
      <div className="CollectionStatisticsGroup__item" key={key}>
        <CollectionStatistics
          collection={collection}
          field={key}
          values={values}
          total={total}
        />
      </div>
    );
  }

  render() {
    const { collection, emptyComponent, intl } = this.props;
    const { statistics = {} } = collection;

    if (!collection.id || statistics.schema === undefined) {
      return <Skeleton.Layout type="multi-column" colCount={3} />;
    }

    const statsToRender = statFields.map(key => ({ key, ...statistics[key] }))
      .filter(stat => stat && stat.total);

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


export default compose(
  withRouter,
  injectIntl,
)(CollectionStatisticsGroup);
