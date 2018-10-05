import React, { Component } from 'react';
import { connect } from "react-redux";
import { injectIntl, FormattedMessage, defineMessages } from 'react-intl';

import { Toolbar, CollectionSearch } from 'src/components/Toolbar';
import CollectionDocumentsMode from 'src/components/Collection/CollectionDocumentsMode';
import CollectionScreenContext from 'src/components/Collection/CollectionScreenContext';
import { selectCollection } from "src/selectors";


const messages = defineMessages({
  screen_title: {
    id: 'collection.documents.title',
    defaultMessage: 'Browse',
  }
});

class CollectionDocumentsScreen extends Component {
  render() {
    const { intl, collection, collectionId } = this.props;

    return (
      <CollectionScreenContext collectionId={collectionId}
                               activeMode="documents"
                               screenTitle={intl.formatMessage(messages.screen_title)}>
        <CollectionDocumentsMode collection={collection} />
      </CollectionScreenContext>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  return {
    collectionId,
    collection: selectCollection(state, collectionId)
  };
};

CollectionDocumentsScreen = injectIntl(CollectionDocumentsScreen);
CollectionDocumentsScreen = connect(mapStateToProps, {})(CollectionDocumentsScreen);
export default CollectionDocumentsScreen;
