import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { fetchCollectionStatistics } from 'src/actions';
import { selectCollectionStatistics } from 'src/selectors';
import { SectionLoading } from 'src/components/common';
import CollectionStatistics from './CollectionStatistics';

import './CollectionStatisticsMode.scss';

const statFields = [
  'schema', 'countries', 'names', 'emails', 'addresses', 'ibans', 'phones',
];

class CollectionStatisticsMode extends React.PureComponent {
  componentDidMount() {
    const { collection } = this.props;
    this.props.fetchCollectionStatistics(collection);
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
    const { statistics } = this.props;
    if (statistics.shouldLoad || statistics.isLoading) {
      return <SectionLoading />;
    }

    const toRender = statFields.map(key => ({ key, ...statistics[key] }))
      .filter(stat => stat && stat.total);

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
)(CollectionStatisticsMode);
