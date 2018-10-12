import React, { Component } from 'react';
import { Redirect } from 'react-router';


class CollectionDocumentsScreen extends Component {
  render() {
    const { collectionId } = this.props.match.params;
    return <Redirect to={`/collections/${collectionId}#mode=Document`} />;
  }
}

export default CollectionDocumentsScreen;
