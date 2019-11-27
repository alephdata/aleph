import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import _ from 'lodash';
import { fetchCollectionStatistics } from 'src/actions';
import { selectCollectionStatistics } from 'src/selectors';
import { getFacetLabel } from 'src/util/getFacetLabel';
import CollectionStatistics from './CollectionStatistics';

import './CollectionStatisticsMode.scss';

const statKeys = [
  'schema', 'emails', 'addresses', 'ibans', 'languages', 'phones', 'names',
];


class CollectionStatisticsMode extends React.PureComponent {
  componentDidMount() {
    const { collection } = this.props;
    this.props.fetchCollectionStatistics(collection);
  }

  renderStatisticsItem(key) {
    const { collection, statistics } = this.props;
    const values = statistics[key];

    console.log('rendering', key, values);

    if (values && !_.isEmpty(values)) {
      return (
        <CollectionStatistics
          collection={collection}
          key={key}
          title={getFacetLabel(key)}
          statistics={values}
        />
      );
    }
    return null;
  }

  render() {
    return (
      <div className="CollectionStatisticsMode">
        {statKeys.map(key => this.renderStatisticsItem(key))}
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
