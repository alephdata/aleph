import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import CollectionOverviewMode from 'components/Collection/CollectionOverviewMode';
import CollectionDocumentsMode from 'components/Collection/CollectionDocumentsMode';
import CollectionEntitiesMode from 'components/Collection/CollectionEntitiesMode';
import CollectionXrefMode from 'components/Collection/CollectionXrefMode';
import CollectionEntitySetsIndexMode from 'components/Collection/CollectionEntitySetsIndexMode';
import collectionViewIds from 'components/Collection/collectionViewIds';

class InvestigationViews extends React.Component {
  render() {
    const { collection, activeMode } = this.props;

    switch(activeMode) {
      case collectionViewIds.OVERVIEW:
        return <CollectionOverviewMode collection={collection} />;
      case collectionViewIds.DOCUMENTS:
        return <CollectionDocumentsMode collection={collection} />;
      case collectionViewIds.ENTITIES:
        return <CollectionEntitiesMode collection={collection} />;
      case collectionViewIds.DIAGRAMS:
        return <CollectionEntitySetsIndexMode collection={collection} type="diagram" />;
      case collectionViewIds.LISTS:
        return <CollectionEntitySetsIndexMode collection={collection} type="list" />;
      case collectionViewIds.XREF:
        return <CollectionXrefMode collection={collection} />;
    }
  }
}

export default InvestigationViews;
