import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { defineMessages, injectIntl } from 'react-intl';

import InvestigationOverviewMode from 'components/Investigation/InvestigationOverviewMode';
import InvestigationMentionsMode from 'components/Investigation/InvestigationMentionsMode';
import InvestigationDocumentsMode from 'components/Investigation/InvestigationDocumentsMode';

import CollectionEntitiesMode from 'components/Collection/CollectionEntitiesMode';
import CollectionSearchMode from 'components/Collection/CollectionSearchMode';
import CollectionXrefMode from 'components/Collection/CollectionXrefMode';
import CollectionEntitySetsIndexMode from 'components/Collection/CollectionEntitySetsIndexMode';

import './InvestigationViews.scss'

class InvestigationViews extends React.Component {
  renderContent() {
    const { collection, activeMode } = this.props;

    switch(activeMode) {
      case 'documents':
        return <InvestigationDocumentsMode collection={collection} />;
      case 'entities':
        return <CollectionEntitiesMode collection={collection} />;
      case 'diagrams':
        return <CollectionEntitySetsIndexMode collection={collection} type="diagram" />;
      case 'lists':
        return <CollectionEntitySetsIndexMode collection={collection} type="list" />;
      case 'mentions':
        return <InvestigationMentionsMode collection={collection} />;
      case 'search':
        return <CollectionSearchMode collection={collection} />;
      case 'xref':
        return <CollectionXrefMode collection={collection} />;
      default:
        return <InvestigationOverviewMode collection={collection} />;
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
