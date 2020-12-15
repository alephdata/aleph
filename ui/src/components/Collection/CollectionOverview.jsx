import React from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import { ErrorSection, Skeleton, Summary } from 'components/common';
import CollectionStatistics from './CollectionStatistics';

import './CollectionOverview.scss';

const statFields = [
  'schema', 'countries', 'names', 'emails', 'addresses', 'ibans', 'phones',
];

const messages = defineMessages({
  empty: {
    id: 'collection.overview.empty',
    defaultMessage: 'This dataset is empty.',
  },
});

class CollectionOverview extends React.Component {
  renderStatisticsItem({ key, total, values }) {
    const { collection } = this.props;
    return (
      <div className="CollectionOverview__item" key={key}>
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
    const { collection, intl } = this.props;
    const { statistics = {} } = collection;

    if (!collection.id || statistics.schema === undefined) {
      return <Skeleton.Layout type="multi-column" colCount={3} />;
    }

    const statsToRender = statFields.map(key => ({ key, ...statistics[key] }))
      .filter(stat => stat && stat.total);

    if (!statsToRender.length) {
      return (
        <ErrorSection
          icon="database"
          title={intl.formatMessage(messages.empty)}
        />
      )
    }

    return (
      <div className="CollectionOverview">
        {statsToRender.map((stat) => this.renderStatisticsItem(stat))}
      </div>
    );
  }
}


export default compose(
  withRouter,
  injectIntl,
)(CollectionOverview);
