import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { fetchCollectionStatistics } from 'src/actions';
import { selectCollectionStatistics } from 'src/selectors';
import { ErrorSection, SectionLoading } from 'src/components/common';
import { Collection, Summary } from 'src/components/common';
import CollectionInfo from 'src/components/Collection/CollectionInfo';
import CollectionStatistics from './CollectionStatistics';
import CollectionReference from './CollectionReference';
import c from 'classnames';

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
      <div className="CollectionOverviewMode__item">
        <CollectionStatistics
          collection={collection}
          key={key}
          field={key}
          values={values}
          total={total}
        />
      </div>
    );
  }

  render() {
    const { collection, intl, statistics } = this.props;
    if (statistics.names === undefined) {
      return <SectionLoading />;
    }

    const toRender = statFields.map(key => ({ key, ...statistics[key] }))
      .filter(stat => stat && stat.total);

    return (
      <div className="CollectionOverviewMode">
        <div className="CollectionOverviewMode__item">
          <div className="CollectionOverviewMode__item__text-content">
            {collection.summary && (
              <Summary text={collection.summary} />
            )}
            <CollectionInfo collection={collection} />
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
