import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';
import c from 'classnames';

import CollectionMetadataPanel from 'components/Collection/CollectionMetadataPanel';
import CollectionStatisticsGroup from 'components/Collection/CollectionStatisticsGroup';
import InvestigationOverview from 'components/Investigation/InvestigationOverview';
import { ErrorSection } from 'components/common';
import { selectCollection } from 'selectors';

import './CollectionOverviewMode.scss';

const messages = defineMessages({
  empty: {
    id: 'collection.overview.empty',
    defaultMessage: 'This dataset is empty.',
  },
});

const CollectionOverviewMode = ({
  collection,
  collectionId,
  intl,
  isCasefile,
}) => {
  const emptyComponent = (
    <ErrorSection icon="database" title={intl.formatMessage(messages.empty)} />
  );

  return (
    <div className={c('CollectionOverviewMode', { casefile: isCasefile })}>
      <div className="CollectionOverviewMode__main">
        {isCasefile && <InvestigationOverview collectionId={collectionId} />}
        {!isCasefile && (
          <CollectionStatisticsGroup
            collectionId={collectionId}
            emptyComponent={emptyComponent}
          />
        )}
      </div>
      <div className="CollectionOverviewMode__secondary">
        <CollectionMetadataPanel collection={collection} />
      </div>
    </div>
  );
};

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps;

  return {
    collection: selectCollection(state, collectionId),
  };
};

export default compose(
  connect(mapStateToProps),
  injectIntl
)(CollectionOverviewMode);
