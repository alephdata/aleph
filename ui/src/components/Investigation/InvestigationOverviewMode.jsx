import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import queryString from 'query-string';

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
        <div className="InvestigationOverview__search">
          <SearchBox
            onSearch={this.onSearch}
            placeholder={intl.formatMessage(messages.searchPlaceholder, { collection: collection.label })}
            inputProps={{ autoFocus: true, large: true }}
          />
        </div>

        <div className="InvestigationOverview__top">
          {collection.summary && (
            <div className="InvestigationOverview__top__item">
              <Summary text={collection.summary} />
            </div>
          )}
          <div className="InvestigationOverview__top__item">
            <CollectionStatus collection={collection} showCancel={collection.writeable} />
            <CollectionInfo collection={collection} />
          </div>
          <div className="InvestigationOverview__top__item narrow">
            <CollectionManageMenu collection={collection} buttonGroupProps={{ vertical: true }} buttonProps={{ className: 'bp3-minimal', alignText: 'left', fill: false }}/>
          </div>
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
            <FormattedMessage id="investigation.overview.notifications" defaultMessage="Quick links" />
          </h6>
          <div className="InvestigationOverview__section__content">
            <InvestigationQuickLinks collection={collection} />
          </div>
        </div>
        <div className="InvestigationOverview__section">
          <h6 className="InvestigationOverview__section__title bp3-heading">
            <FormattedMessage id="investigation.overview.reference" defaultMessage="Developer tools" />
          </h6>
          <div className="InvestigationOverview__section__content">
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
