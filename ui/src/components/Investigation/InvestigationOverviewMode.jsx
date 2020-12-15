import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import queryString from 'query-string';
import { AnchorButton, ButtonGroup, Intent } from '@blueprintjs/core';

import { SearchBox, Skeleton } from 'components/common';
import Query from 'app/Query';
import NotificationList from 'components/Notification/NotificationList';
import InvestigationQuickLinks from 'components/Investigation/InvestigationQuickLinks';
import CollectionHeading from 'components/Collection/CollectionHeading';
import CollectionMetadataPanel from 'components/Collection/CollectionMetadataPanel';
import { selectNotificationsResult } from 'selectors';

import './InvestigationOverviewMode.scss';

const guidesURLPrefix = "https://docs.alephdata.org/guide/building-out-your-investigation/";

class InvestigationOverviewMode extends React.Component {

  render() {
    const { collection, intl, notificationsQuery, notificationsResult } = this.props;

    return (
      <div className="InvestigationOverview">
        <div className="InvestigationOverview__main">
          {(notificationsResult.total > 0 || notificationsResult.isPending) && (
            <div className="InvestigationOverview__section">
              <h6 className="InvestigationOverview__section__title bp3-heading">
                <FormattedMessage id="investigation.overview.notifications" defaultMessage="Recent activity" />
              </h6>
              <div className="InvestigationOverview__section__content">
                <NotificationList query={notificationsQuery} showCollectionLinks={false} />
              </div>
            </div>
          )}
          <div className="InvestigationOverview__section">
            <h6 className="InvestigationOverview__section__title bp3-heading">
              <FormattedMessage id="investigation.overview.shortcuts" defaultMessage="Quick links" />
            </h6>
            <div className="InvestigationOverview__section__content">
              <InvestigationQuickLinks collection={collection} />
            </div>
          </div>
          <div className="InvestigationOverview__section">
            <h6 className="InvestigationOverview__section__title bp3-heading">
              <FormattedMessage id="investigation.overview.guides" defaultMessage="Read more" />
            </h6>
            <div className="InvestigationOverview__section__content">
              <div className="InvestigationOverview__guides">
                <AnchorButton minimal intent={Intent.PRIMARY} alignText="left" icon="people" target="_blank" href={`${guidesURLPrefix}creating-a-personal-dataset#managing-access-to-your-personal-dataset`}>
                  <FormattedMessage id="investigation.overview.guides" defaultMessage="Managing access" />
                </AnchorButton>
                <AnchorButton minimal intent={Intent.PRIMARY} alignText="left" icon="upload" target="_blank" href={`${guidesURLPrefix}cross-referencing`}>
                  <FormattedMessage id="investigation.overview.guides" defaultMessage="Uploading documents" />
                </AnchorButton>
                <AnchorButton minimal intent={Intent.PRIMARY} alignText="left" icon="graph" target="_blank" href={`${guidesURLPrefix}uploading-documents`}>
                  <FormattedMessage id="investigation.overview.guides" defaultMessage="Drawing network diagrams" />
                </AnchorButton>
                <AnchorButton minimal intent={Intent.PRIMARY} alignText="left" icon="new-object" target="_blank" href={`${guidesURLPrefix}using-the-table-editor`}>
                  <FormattedMessage id="investigation.overview.guides" defaultMessage="Creating & editing entities" />
                </AnchorButton>
                <AnchorButton minimal intent={Intent.PRIMARY} alignText="left" icon="table" target="_blank" href={`${guidesURLPrefix}generating-multiple-entities-from-a-list`}>
                  <FormattedMessage id="investigation.overview.guides" defaultMessage="Generating entities from a spreadsheet" />
                </AnchorButton>
                <AnchorButton minimal intent={Intent.PRIMARY} alignText="left" icon="comparison" target="_blank" href={`${guidesURLPrefix}cross-referencing`}>
                  <FormattedMessage id="investigation.overview.guides" defaultMessage="Cross-referencing your data" />
                </AnchorButton>
              </div>
            </div>
          </div>
        </div>
        <div className="InvestigationOverview__secondary">
          <CollectionMetadataPanel collection={collection} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;

  const context = {
    'facet': 'event',
    'filter:channels': `Collection:${collection.id}`
  }

  const notificationsQuery = Query.fromLocation('notifications', location, context, '')
    .limit(40);
  const notificationsResult = selectNotificationsResult(state, notificationsQuery);


  return {
    notificationsQuery,
    notificationsResult,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(InvestigationOverviewMode);
