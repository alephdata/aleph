import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { defineMessages, injectIntl } from 'react-intl';

import CollectionOverviewMode from 'components/Collection/CollectionOverviewMode';
import CollectionDocumentsMode from 'components/Collection/CollectionDocumentsMode';
import CollectionEntitiesMode from 'components/Collection/CollectionEntitiesMode';
import CollectionXrefMode from 'components/Collection/CollectionXrefMode';
import CollectionEntitySetsIndexMode from 'components/Collection/CollectionEntitySetsIndexMode';
import collectionViewIds from 'components/Collection/collectionViewIds';

import './InvestigationViews.scss'

class InvestigationViews extends React.Component {
  renderContent() {
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

  render() {
    const { activeMode, intl } = this.props;
    return (
      <>
        <div className="InvestigationViews__content">
          {this.renderContent()}
        </div>
      </>
    )
  }
}

export default injectIntl(InvestigationViews);
