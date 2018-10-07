import React, { Component } from 'react';
import { connect } from "react-redux";
import { withRouter } from 'react-router';
import { injectIntl, defineMessages } from 'react-intl';

import CollectionScreenContext from 'src/components/Collection/CollectionScreenContext';
import NotificationList from 'src/components/Notification/NotificationList';
import Query from 'src/app/Query';
import { selectCollection } from "src/selectors";

const messages = defineMessages({
  screen_title: {
    id: 'collection.screen.title',
    defaultMessage: 'Casefile',
  }
});


class CaseScreen extends Component {
  render() {
    const { intl, collection, collectionId, notificationsQuery } = this.props;
    return (
      <CollectionScreenContext collectionId={collectionId}
                               activeMode="home"
                               screenTitle={intl.formatMessage(messages.screen_title)}>
        <NotificationList query={notificationsQuery} />
      </CollectionScreenContext>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, match } = ownProps;
  const { collectionId } = match.params;
  const path = `collections/${collectionId}/notifications`;
  const query = Query.fromLocation(path, location, {}, 'notifications').limit(40);
  return {
    collectionId,
    collection: selectCollection(state, collectionId),
    notificationsQuery: query
  };
};

CaseScreen = injectIntl(CaseScreen);
CaseScreen = connect(mapStateToProps, {})(CaseScreen);
CaseScreen = withRouter(CaseScreen);
export default CaseScreen;
