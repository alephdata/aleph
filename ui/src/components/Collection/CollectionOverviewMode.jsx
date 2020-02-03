import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { fetchCollectionStatistics } from 'src/actions';
import { selectCollectionStatistics } from 'src/selectors';
import { ErrorSection, SectionLoading } from 'src/components/common';
import { Collection } from 'src/components/common';
import CollectionInfoMode from 'src/components/Collection/CollectionInfoMode';
import CollectionStatistics from './CollectionStatistics';
import ClipboardInput from 'src/components/common/ClipboardInput';
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
        <div className="CollectionOverviewMode__section">
          <div className="CollectionOverviewMode__summary">
            {collection.summary && (
              <div className={c('CollectionOverviewMode__summary__description', { expanded: collection.summary.length > 300 })}>
                <Collection.Summary collection={collection} />
              </div>
            )}
            <div className="CollectionOverviewMode__summary__metadata">
              <CollectionInfoMode collection={collection} />
            </div>
          </div>
        </div>
        <div className="CollectionOverviewMode__section">
          <div className="CollectionOverviewMode__statistics">
            {toRender.map((stat) => this.renderStatisticsItem(stat))}
          </div>
        </div>
        <div className="CollectionOverviewMode__section">
          <div className="CollectionOverviewMode__reference">
            <div className="CollectionOverviewMode__reference__section">
              <div className="key text-muted">
                <FormattedMessage id="collection.foreign_id" defaultMessage="Foreign ID" />
              </div>
              <div className="value">
                <code>{collection.foreign_id}</code>
              </div>
            </div>
            <div className="CollectionOverviewMode__reference__section">
              <div className="key text-muted">
                <FormattedMessage id="collection.reconcile" defaultMessage="Reconciliation" />
              </div>
              <div className="value bp3-callout">
                <ClipboardInput value={collection.links.reconcile} />
                <span className="bp3-text-small bp3-text-muted">
                  <FormattedMessage
                    id="collection.reconcile.description"
                    defaultMessage="Match your own data against the entities in this collection using the free {openrefine}
                  tool by adding the reconciliation endpoint."
                    values={{
                      openrefine: <a href="http://openrefine.org">OpenRefine</a>,
                    }}
                  />
                </span>
              </div>
            </div>
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
