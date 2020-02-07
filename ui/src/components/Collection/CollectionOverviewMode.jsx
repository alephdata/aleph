import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl } from 'react-intl';
import { fetchCollectionStatistics } from 'src/actions';
import { selectCollectionStatistics } from 'src/selectors';
import { Summary } from 'src/components/common';
import CollectionInfo from 'src/components/Collection/CollectionInfo';
import CollectionStatistics from './CollectionStatistics';
import CollectionReference from './CollectionReference';
import CollectionStatus from './CollectionStatus';


import './CollectionOverviewMode.scss';

const statFields = [
  'schema', 'countries', 'names', 'emails', 'addresses', 'ibans', 'phones',
];


class CollectionOverviewMode extends React.Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { collection, statistics } = this.props;
    if (statistics.shouldLoad) {
      this.props.fetchCollectionStatistics(collection);
    }
  }

  renderStatisticsItem({ key, values, total }) {
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
    const { collection, statistics } = this.props;

    const toRender = statistics
      ? statFields.map(key => ({ key, ...statistics[key] }))
        .filter(stat => stat && stat.total)
      : [];

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
            <CollectionStatus collection={collection} showCancel />
          </div>
        </div>
        {toRender.map((stat) => this.renderStatisticsItem(stat))}
        <div className="CollectionOverviewMode__item">
          <div className="CollectionOverviewMode__item__text-content">
            <CollectionReference collection={collection} />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  return {
    statistics: selectCollectionStatistics(state, collection.id),
  };
};

const mapDispatchToProps = { fetchCollectionStatistics };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(CollectionOverviewMode);
