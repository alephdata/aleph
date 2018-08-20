import React, { Component } from 'react';
import { connect } from "react-redux";
import { withRouter } from 'react-router';

import Screen from 'src/components/Screen/Screen';
import { Breadcrumbs, DualPane } from 'src/components/common';
import { CollectionInfoContent, CollectionOverview } from 'src/components/Collection';
import CollectionScreenContext from 'src/components/Collection/CollectionScreenContext';
import { Toolbar, CollectionSearch } from 'src/components/Toolbar';
import NotificationList from 'src/components/Notification/NotificationList';
import Query from 'src/app/Query';
import { fetchCollection } from "src/actions";
import { selectCollection } from "src/selectors";


class CaseScreen extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { collectionId, collection } = this.props;
    if (collection.shouldLoad) {
      this.props.fetchCollection({ id: collectionId });
    }
  }

  render() {
    const { collection, notificationsQuery } = this.props;
    return (
      <CollectionScreenContext collection={collection}>
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

CaseScreen = connect(mapStateToProps, { fetchCollection })(CaseScreen);
CaseScreen = withRouter(CaseScreen);
export default CaseScreen;
