import React from 'react';
import { Redirect } from 'react-router';


export default function CollectionDocumentsScreen(props) {
  const { collectionId } = props.match.params;
  return <Redirect to={`/collections/${collectionId}#mode=Document`} />;
}
