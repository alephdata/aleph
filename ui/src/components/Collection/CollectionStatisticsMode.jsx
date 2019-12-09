import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import { fetchCollectionStatistics } from 'src/actions';
import { selectCollectionStatistics } from 'src/selectors';
import { ErrorSection, SectionLoading } from 'src/components/common';
import CollectionStatistics from './CollectionStatistics';

import './CollectionStatisticsMode.scss';

const statFields = [
  'schema', 'countries', 'names', 'emails', 'addresses', 'ibans', 'phones',
];

const messages = defineMessages({
  empty: {
    id: 'collection.statistics.empty',
    defaultMessage: 'No statistics available for this dataset',
  },
});

class CollectionStatisticsMode extends React.Component {
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
    const { intl, statistics } = this.props;
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
      <div className="CollectionStatisticsMode">
        {toRender.map((stat) => this.renderStatisticsItem(stat))}
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
)(CollectionStatisticsMode);
