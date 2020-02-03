import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import { fetchCollectionStatistics } from 'src/actions';
import { selectCollectionStatistics } from 'src/selectors';
import { ErrorSection, SectionLoading } from 'src/components/common';
import { Collection } from 'src/components/common';
import CollectionInfoMode from 'src/components/Collection/CollectionInfoMode';
import CollectionStatistics from './CollectionStatistics';

import './CollectionOverviewMode.scss';

const statFields = [
  'schema', 'countries', 'names', 'emails', 'addresses', 'ibans', 'phones',
];

const messages = defineMessages({
  empty: {
    id: 'collection.statistics.empty',
    defaultMessage: 'No statistics available for this dataset',
  },
});

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
      <CollectionStatistics
        collection={collection}
        key={key}
        field={key}
        values={values}
        total={total}
      />
    );
  }

  render() {
    const { collection, intl, statistics } = this.props;
    if (statistics.names === undefined) {
      return <SectionLoading />;
    }

    const toRender = statFields.map(key => ({ key, ...statistics[key] }))
      .filter(stat => stat && stat.total);

    if (toRender.length === 0) {
      return (
        <ErrorSection
          icon="grouped-bar-chart"
          title={intl.formatMessage(messages.empty)}
        />
      );
    }

    return (
      <div className="CollectionOverviewMode">
        {collection.summary && (
          <div className="CollectionOverviewMode__section summary-container">
            <div className="CollectionOverviewMode__description">
              <Collection.Summary collection={collection} />
            </div>
            <div className="CollectionOverviewMode__metadata">
              <CollectionInfoMode collection={collection} />
            </div>
          </div>
        )}

        <div className="CollectionOverviewMode__section statistics-container">
          {toRender.map((stat) => this.renderStatisticsItem(stat))}
        </div>
        <div className="CollectionOverviewMode__section">

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
