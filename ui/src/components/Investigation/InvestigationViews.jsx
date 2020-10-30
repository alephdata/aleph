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

const messages = defineMessages({
  overview: {
    id: 'collection.info.overview',
    defaultMessage: 'Overview',
  },
  entities: {
    id: 'collection.info.entities',
    defaultMessage: 'Entities',
  },
  diagrams: {
    id: 'collection.info.diagrams',
    defaultMessage: 'Network diagrams',
  },
  lists: {
    id: 'collection.info.lists',
    defaultMessage: 'Lists',
  },
  documents: {
    id: 'collection.info.browse',
    defaultMessage: 'Browse folders',
  },
  mappings: {
    id: 'collection.info.mappings',
    defaultMessage: 'Mappings',
  },
  mentions: {
    id: 'collection.info.mentions',
    defaultMessage: 'Mentions',
  },
});

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
        <h4 className="InvestigationViews__title bp3-heading">
          {intl.formatMessage(messages[activeMode] )}
        </h4>
        <div className="InvestigationViews__content">
          {this.renderContent()}
        </div>
      </>
    )
  }
}

export default injectIntl(InvestigationViews);
