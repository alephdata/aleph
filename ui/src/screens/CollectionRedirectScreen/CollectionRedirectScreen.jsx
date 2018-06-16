import React, { Component } from 'react';
import { withRouter } from "react-router";
import { connect } from 'react-redux';

import { fetchCollection } from 'src/actions';
import { selectCollection } from 'src/selectors';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import getCollectionLink from 'src/util/getCollectionLink';


class CollectionRedirectScreen extends Component {
  componentDidMount() {
    const { collectionId } = this.props;
    this.props.fetchCollection({ id: collectionId });
  }

  componentDidUpdate(prevProps) {
    const { collectionId } = this.props;
    if (collectionId !== prevProps.collectionId) {
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
