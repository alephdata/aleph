import React, { Component } from 'react';
import { connect } from "react-redux";
import { withRouter } from 'react-router';

import CollectionScreenContext from 'src/components/Collection/CollectionScreenContext';
import { Toolbar, CollectionSearch } from 'src/components/Toolbar';
import NotificationList from 'src/components/Notification/NotificationList';
import Query from 'src/app/Query';
import { selectCollection } from "src/selectors";


class CaseScreen extends Component {
  render() {
    const { collection, collectionId, notificationsQuery } = this.props;
    return (
      <CollectionScreenContext collectionId={collectionId} activeMode="home">
        <Toolbar>
          <CollectionSearch collection={collection} />
        </Toolbar>
        <NotificationList query={notificationsQuery} />
      </CollectionScreenContext>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const { collectionId } = ownProps.match.params;
  const path = `collections/${collectionId}/notifications`;
  const query = Query.fromLocation(path, location, {}, 'notifications').limit(40);
  return {
    collectionId,
    collection: selectCollection(state, collectionId),
    notificationsQuery: query
  };
};

CaseScreen = connect(mapStateToProps, {})(CaseScreen);
CaseScreen = withRouter(CaseScreen);
export default CaseScreen;
