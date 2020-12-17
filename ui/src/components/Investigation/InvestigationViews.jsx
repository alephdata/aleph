import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { defineMessages, injectIntl } from 'react-intl';

// import InvestigationOverviewMode from 'components/Investigation/InvestigationOverviewMode';
// import InvestigationMentionsMode from 'components/Investigation/InvestigationMentionsMode';
// import InvestigationDocumentsMode from 'components/Investigation/InvestigationDocumentsMode';

import CollectionDocumentsMode from 'components/Collection/CollectionDocumentsMode';
import CollectionOverviewMode from 'components/Collection/CollectionOverviewMode';
import CollectionMappingsMode from 'components/Collection/CollectionMappingsMode';
import CollectionEntitiesMode from 'components/Collection/CollectionEntitiesMode';
import CollectionXrefMode from 'components/Collection/CollectionXrefMode';
import CollectionEntitySetsIndexMode from 'components/Collection/CollectionEntitySetsIndexMode';
import CollectionView from 'components/Collection/CollectionView';
import CollectionViewIds from 'components/Collection/collectionViewIds';
import FacetedEntitySearch from 'components/EntitySearch/FacetedEntitySearch';
import { Schema } from 'components/common';
import { queryCollectionEntities } from 'queries';
import { selectEntitiesResult } from 'selectors';


import './InvestigationViews.scss'

class InvestigationViews extends React.Component {
  renderContent() {
    const { collection, activeMode, searchQuery, searchResult } = this.props;

    switch(activeMode) {
      case 'documents':
        return <CollectionDocumentsMode collection={collection} />;
      case 'entities':
        return <CollectionEntitiesMode collection={collection} />;
      case 'diagrams':
        return <CollectionEntitySetsIndexMode collection={collection} type="diagram" />;
      case 'lists':
        return <CollectionEntitySetsIndexMode collection={collection} type="list" />;
      case 'mappings':
        return <CollectionMappingsMode collection={collection} />;
      // case 'mentions':
      //   return <InvestigationMentionsMode collection={collection} />;
      case 'search':
        return <FacetedEntitySearch query={searchQuery} result={searchResult} />;
      case 'xref':
        return <CollectionXrefMode collection={collection} />;
      default:
        return <CollectionOverviewMode collection={collection} isCasefile />;
    }
  }

  render() {
    const { activeMode, activeType, intl } = this.props;

    let title, subheading;
    if (activeMode === CollectionViewIds.SEARCH) {
      title = null;
    } else if (!!activeType) {
      title = <Schema.Label schema={activeType} plural icon />;
      subheading = <Schema.Description schema={activeType} />
    } else if (!!activeMode) {
      title = <CollectionView.Label id={activeMode} icon />;
      subheading = <CollectionView.Description id={activeMode} />
    }

    return (
      <div className="InvestigationViews">
        {!!title && (
          <div className="InvestigationViews__title-container">
            <h5 className="InvestigationViews__title">
              <span>{title}</span>
            </h5>
            {subheading && <p className="InvestigationViews__subheading">{subheading}</p>}
          </div>
        )}
        <div className="InvestigationViews__content">
          {this.renderContent()}
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const searchQuery = queryCollectionEntities(location, collection.id);

  return {
    searchQuery,
    searchResult: selectEntitiesResult(state, searchQuery)
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(InvestigationViews);
