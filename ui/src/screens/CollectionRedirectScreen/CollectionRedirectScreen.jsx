import React, { Component } from 'react';
import { withRouter } from "react-router";
import { connect } from 'react-redux';

import { fetchCollection } from 'src/actions';
import { selectCollection } from 'src/selectors';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import getCollectionLink from 'src/util/getCollectionLink';


class CollectionRedirectScreen extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { collectionId, collection } = this.props;
    if (collection.shouldLoad) {
      this.props.fetchCollection({ id: collectionId });
    }
  }

  render() {
    const { collection, history } = this.props;
    if (collection.id === undefined) {
      return <LoadingScreen />;
    }
    history.replace(getCollectionLink(collection));
    return null;
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  return { collectionId, collection: selectCollection(state, collectionId) };
};

CollectionRedirectScreen = withRouter(CollectionRedirectScreen);
CollectionRedirectScreen = connect(mapStateToProps, { fetchCollection })(CollectionRedirectScreen);
export default CollectionRedirectScreen;
