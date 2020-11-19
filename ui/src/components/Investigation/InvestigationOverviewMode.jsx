import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import queryString from 'query-string';
import { AnchorButton, ButtonGroup } from '@blueprintjs/core';


import { SearchBox, Skeleton, Summary } from 'components/common';
import Query from 'app/Query';
import NotificationList from 'components/Notification/NotificationList';
import InvestigationQuickLinks from 'components/Investigation/InvestigationQuickLinks';
import CollectionReference from 'components/Collection/CollectionReference';
import CollectionInfo from 'components/Collection/CollectionInfo';
import CollectionStatus from 'components/Collection/CollectionStatus';
import CollectionHeading from 'components/Collection/CollectionHeading';
import CollectionManageMenu from 'components/Collection/CollectionManageMenu';
import collectionViewIds from 'components/Collection/collectionViewIds';
import { selectNotificationsResult } from 'selectors';


import './InvestigationOverviewMode.scss';

const messages = defineMessages({
  searchPlaceholder: {
    id: 'collection.info.search',
    defaultMessage: 'Search {collection}',
  }
});

const guidesURLPrefix = "https://docs.alephdata.org/guide/building-out-your-investigation/";

class InvestigationOverviewMode extends React.Component {
  constructor(props) {
    super(props);
    this.onSearch = this.onSearch.bind(this);
  }
  onSearch(queryText) {
    const { history, collection, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash.mode = collectionViewIds.SEARCH;
    delete parsedHash.type;

    const query = {
      q: queryText,
      'filter:collection_id': collection.id,
    };

    history.push({
      pathname: location.pathname,
      hash: queryString.stringify(parsedHash),
      search: queryString.stringify(query)
    });
  }

  render() {
    const { collection, intl, notificationsQuery, notificationsResult } = this.props;

    // <h6 className="InvestigationOverview__section__title bp3-heading">
    //   <FormattedMessage id="investigation.overview.search" defaultMessage="Search" />
    // </h6>

    return (
      <div className="InvestigationOverview">
        <div className="InvestigationOverview__main">
          <div className="InvestigationOverview__search">
            <SearchBox
              onSearch={this.onSearch}
              placeholder={intl.formatMessage(messages.searchPlaceholder, { collection: collection.label })}
              inputProps={{ autoFocus: true, large: true }}
            />
          </div>
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
                <AnchorButton outlined alignText="left" icon="people" target="_blank" href={`${guidesURLPrefix}creating-a-personal-dataset#managing-access-to-your-personal-dataset`}>
                  <FormattedMessage id="investigation.overview.guides" defaultMessage="Managing access" />
                </AnchorButton>
                <AnchorButton outlined alignText="left" icon="upload" target="_blank" href={`${guidesURLPrefix}cross-referencing`}>
                  <FormattedMessage id="investigation.overview.guides" defaultMessage="Uploading documents" />
                </AnchorButton>
                <AnchorButton outlined alignText="left" icon="graph" target="_blank" href={`${guidesURLPrefix}uploading-documents`}>
                  <FormattedMessage id="investigation.overview.guides" defaultMessage="Drawing network diagrams" />
                </AnchorButton>
                <AnchorButton outlined alignText="left" icon="new-object" target="_blank" href={`${guidesURLPrefix}using-the-table-editor`}>
                  <FormattedMessage id="investigation.overview.guides" defaultMessage="Creating & editing entities" />
                </AnchorButton>
                <AnchorButton outlined alignText="left" icon="table" target="_blank" href={`${guidesURLPrefix}generating-multiple-entities-from-a-list`}>
                  <FormattedMessage id="investigation.overview.guides" defaultMessage="Generating entities from a spreadsheet" />
                </AnchorButton>
                <AnchorButton outlined alignText="left" icon="comparison" target="_blank" href={`${guidesURLPrefix}cross-referencing`}>
                  <FormattedMessage id="investigation.overview.guides" defaultMessage="Cross-referencing your data" />
                </AnchorButton>
              </div>
            </div>
          </div>
        </div>
        <div className="InvestigationOverview__secondary">
          <div className="InvestigationOverview__secondary__vertical-container">
            <div className="InvestigationOverview__secondary__item">
              <Summary text={collection.summary} />
            </div>
            <CollectionStatus collection={collection} showCancel={collection.writeable} className="InvestigationOverview__secondary__item" />
          </div>
          <div className="InvestigationOverview__secondary__item">
            <CollectionInfo collection={collection} />
            <div className="InvestigationOverview__secondary__actions">
              <CollectionManageMenu collection={collection} />
            </div>
          </div>
          <div className="InvestigationOverview__secondary__item mobile-hide">
            <CollectionReference collection={collection} />
          </div>
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

  const notificationsQuery = Query.fromLocation('notifications', location, context, 'notifications')
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
