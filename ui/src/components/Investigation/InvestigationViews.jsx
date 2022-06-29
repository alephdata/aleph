{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { defineMessages, injectIntl } from 'react-intl';

import withRouter from 'app/withRouter'
import CollectionDocumentsMode from 'components/Collection/CollectionDocumentsMode';
import CollectionOverviewMode from 'components/Collection/CollectionOverviewMode';
import CollectionStatisticsGroup from 'components/Collection/CollectionStatisticsGroup';
import CollectionMappingsMode from 'components/Collection/CollectionMappingsMode';
import CollectionEntitiesMode from 'components/Collection/CollectionEntitiesMode';
import CollectionXrefMode from 'components/Collection/CollectionXrefMode';
import CollectionEntitySetsIndexMode from 'components/Collection/CollectionEntitySetsIndexMode';
import CollectionView from 'components/Collection/CollectionView';
import CollectionViewIds from 'components/Collection/collectionViewIds';
import FacetedEntitySearch from 'components/EntitySearch/FacetedEntitySearch';
import { ErrorSection, Schema } from 'components/common';
import { collectionSearchQuery } from 'queries';
import { selectEntitiesResult } from 'selectors';


import './InvestigationViews.scss'

const messages = defineMessages({
  empty: {
    id: 'investigation.mentions.empty',
    defaultMessage: 'There are no mentions yet in this investigation.',
  },
});

class InvestigationViews extends React.Component {
  renderContent() {
    const { collectionId, activeMode, intl, searchQuery, searchResult } = this.props;

    const mentionsEmpty = (
      <ErrorSection
        icon="tag"
        title={intl.formatMessage(messages.empty)}
      />
    )

    switch (activeMode) {
      case 'documents':
        return <CollectionDocumentsMode collectionId={collectionId} />;
      case 'entities':
        return <CollectionEntitiesMode collectionId={collectionId} />;
      case 'diagrams':
        return <CollectionEntitySetsIndexMode collectionId={collectionId} type="diagram" />;
      case 'lists':
        return <CollectionEntitySetsIndexMode collectionId={collectionId} type="list" />;
      case 'timelines':
        return <CollectionEntitySetsIndexMode collectionId={collectionId} type="timeline" />;
      case 'mappings':
        return <CollectionMappingsMode collectionId={collectionId} />;
      case 'mentions':
        return <CollectionStatisticsGroup collectionId={collectionId} emptyComponent={mentionsEmpty} />;
      case 'search':
        return <FacetedEntitySearch query={searchQuery} result={searchResult} />;
      case 'xref':
        return <CollectionXrefMode collectionId={collectionId} />;
      default:
        return <CollectionOverviewMode collectionId={collectionId} isCasefile />;
    }
  }

  render() {
    const { activeMode, activeType } = this.props;

    let title, subheading;
    if (activeMode === CollectionViewIds.SEARCH) {
      title = null;
    } else if (!!activeType) {
      title = <Schema.Label schema={activeType} plural icon />;
      subheading = <Schema.Description schema={activeType} />
    } else if (!!activeMode) {
      title = <CollectionView.Label id={activeMode} icon isCasefile />;
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
  const { collectionId, location } = ownProps;
  const searchQuery = collectionSearchQuery(location, collectionId, { highlight: true });

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
