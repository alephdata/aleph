{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { AnchorButton, Intent } from '@blueprintjs/core';

import withRouter from 'app/withRouter'
import Query from 'app/Query';
import NotificationList from 'components/Notification/NotificationList';
import InvestigationQuickLinks from 'components/Investigation/InvestigationQuickLinks';
import { selectCollection, selectNotificationsResult } from 'selectors';

import './InvestigationOverview.scss';

const guidesURLPrefix = "https://docs.alephdata.org/guide/building-out-your-investigation/";

class InvestigationOverview extends React.Component {
  render() {
    const { collection, notificationsQuery, notificationsResult } = this.props;

    return (
      <div className="InvestigationOverview">
        {(notificationsResult.total > 0 || notificationsResult.total === undefined) && (
          <div className="InvestigationOverview__section">
            <h6 className="InvestigationOverview__section__title bp3-heading bp3-text-muted">
              <FormattedMessage id="investigation.overview.notifications" defaultMessage="Recent activity" />
            </h6>
            <div className="InvestigationOverview__section__content">
              <NotificationList query={notificationsQuery} showCollectionLinks={false} loadOnScroll={false} />
            </div>
          </div>
        )}
        <div className="InvestigationOverview__section">
          <h6 className="InvestigationOverview__section__title bp3-heading bp3-text-muted">
            {!!collection.count && <FormattedMessage id="investigation.overview.shortcuts" defaultMessage="Quick links" />}
            {!collection.count && <FormattedMessage id="investigation.overview.shortcuts_empty" defaultMessage="Getting started" />}
          </h6>
          <div className="InvestigationOverview__section__content">
            <InvestigationQuickLinks collection={collection} />
          </div>
        </div>
        <div className="InvestigationOverview__section">
          <h6 className="InvestigationOverview__section__title bp3-heading bp3-text-muted">
            <FormattedMessage id="investigation.overview.guides" defaultMessage="Read more" />
          </h6>
          <div className="InvestigationOverview__section__content">
            <div className="InvestigationOverview__guides">
              <AnchorButton minimal intent={Intent.PRIMARY} alignText="left" icon="people" target="_blank" href={`${guidesURLPrefix}creating-an-investigation#managing-access-to-your-investigation`}>
                <FormattedMessage id="investigation.overview.guides.access" defaultMessage="Managing access" />
              </AnchorButton>
              <AnchorButton minimal intent={Intent.PRIMARY} alignText="left" icon="upload" target="_blank" href={`${guidesURLPrefix}uploading-documents`}>
                <FormattedMessage id="investigation.overview.guides.documents" defaultMessage="Uploading documents" />
              </AnchorButton>
              <AnchorButton minimal intent={Intent.PRIMARY} alignText="left" icon="graph" target="_blank" href={`${guidesURLPrefix}network-diagrams`}>
                <FormattedMessage id="investigation.overview.guides.diagrams" defaultMessage="Drawing network diagrams" />
              </AnchorButton>
              <AnchorButton minimal intent={Intent.PRIMARY} alignText="left" icon="new-object" target="_blank" href={`${guidesURLPrefix}using-the-table-editor`}>
                <FormattedMessage id="investigation.overview.guides.entities" defaultMessage="Creating & editing entities" />
              </AnchorButton>
              <AnchorButton minimal intent={Intent.PRIMARY} alignText="left" icon="table" target="_blank" href={`${guidesURLPrefix}generating-multiple-entities-from-a-list`}>
                <FormattedMessage id="investigation.overview.guides.mappings" defaultMessage="Generating entities from a spreadsheet" />
              </AnchorButton>
              <AnchorButton minimal intent={Intent.PRIMARY} alignText="left" icon="comparison" target="_blank" href={`${guidesURLPrefix}cross-referencing`}>
                <FormattedMessage id="investigation.overview.guides.xref" defaultMessage="Cross-referencing your data" />
              </AnchorButton>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId, location } = ownProps;

  const context = {
    'facet': 'event',
    'filter:channels': `Collection:${collectionId}`
  }
  const notificationsQuery = Query.fromLocation('notifications', location, context, '')
    .limit(40);
  const notificationsResult = selectNotificationsResult(state, notificationsQuery);

  return {
    collection: selectCollection(state, collectionId),
    notificationsQuery,
    notificationsResult,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(InvestigationOverview);
