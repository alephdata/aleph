import React from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { injectIntl } from 'react-intl';
import { Skeleton, Summary } from 'components/common';
import CollectionInfo from 'components/Collection/CollectionInfo';
import CollectionStatistics from './CollectionStatistics';
import CollectionReference from './CollectionReference';
import CollectionStatus from './CollectionStatus';


import './CollectionOverviewMode.scss';

const statFields = [
  'schema', 'countries', 'names', 'emails', 'addresses', 'ibans', 'phones',
];


class CollectionOverviewMode extends React.Component {

  renderStatisticsItem({ key, total, values }) {
    const { collection } = this.props;
    return (
      <div className="CollectionOverviewMode__item" key={key}>
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
    const { collection } = this.props;
    const { statistics = {} } = collection;

    if (!collection.id || statistics.schema === undefined) {
      return <Skeleton.Layout type="multi-column" colCount={4} />;
    }

    const statsToRender = statFields.map(key => ({ key, ...statistics[key] }))
      .filter(stat => stat && stat.total);

    return (
      <div className="CollectionOverviewMode">
        <div className="CollectionOverviewMode__item">
          <div className="CollectionOverviewMode__item__text-content">
            {collection.summary && (
              <>
                <div className="CollectionOverviewMode__summary">
                  <Summary text={collection.summary} />
                </div>
                <div className="CollectionOverviewMode__item__text-content__divider" />
              </>
            )}
            <CollectionInfo collection={collection} />
            <div className="CollectionOverviewMode__item__text-content__divider" />
            <CollectionStatus collection={collection} showCancel={collection.writeable} />
          </div>
        </div>
        {statsToRender.map((stat) => this.renderStatisticsItem(stat))}
        <div className="CollectionOverviewMode__item">
          <div className="CollectionOverviewMode__item__text-content">
            <CollectionReference collection={collection} />
          </div>
        </div>
      </div>
    );
  }
}


export default compose(
  withRouter,
  injectIntl,
)(CollectionOverviewMode);
