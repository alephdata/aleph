import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import queryString from 'query-string';

import { SearchBox, Skeleton, Summary } from 'components/common';
import Query from 'app/Query';
import NotificationList from 'components/Notification/NotificationList';
import CollectionReference from 'components/Collection/CollectionReference';
import collectionViewIds from 'components/Collection/collectionViewIds';


// import './InvestigationOverviewMode.scss';

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
    const { collection, intl, notificationsQuery } = this.props;

    return (
      <div className="InvestigationOverview">
        <div className="InvestigationOverview__section">
          <h6 className="InvestigationOverview__section__title">
            <FormattedMessage id="investigation.overview.search" defaultMessage="Search" />
          </h6>
          <SearchBox
            onSearch={this.onSearch}
            placeholder={intl.formatMessage(messages.searchPlaceholder, { collection: collection.label })}
            inputProps={{ autoFocus: true, large: true }}
          />
        </div>
        <div className="InvestigationOverview__section">
          <h6 className="InvestigationOverview__section__title">
            <FormattedMessage id="investigation.overview.notifications" defaultMessage="Recent activity" />
          </h6>
          <NotificationList query={notificationsQuery} showCollectionLinks={false} />
        </div>
        <div className="InvestigationOverview__section">
          <h6 className="InvestigationOverview__section__title">
            <FormattedMessage id="investigation.overview.reference" defaultMessage="Developer tools" />
          </h6>
          <CollectionReference collection={collection} />
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

  return {
    notificationsQuery,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(InvestigationOverviewMode);
