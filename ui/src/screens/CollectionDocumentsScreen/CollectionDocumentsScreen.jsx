import React, { Component } from 'react';
import { connect } from "react-redux";

import { Breadcrumbs } from 'src/components/common';
import { Toolbar, DocumentUploadButton, DocumentFolderButton, CollectionSearch } from 'src/components/Toolbar';
import Screen from 'src/components/Screen/Screen';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import CaseContext from "src/components/Case/CaseContext";
import { fetchCollection } from "src/actions";
import { selectCollection } from "src/selectors";
import EntitySearch from "src/components/EntitySearch/EntitySearch";


class CollectionDocumentsScreen extends Component {
  async componentDidMount() {
    const {collectionId} = this.props;
    this.props.fetchCollection({id: collectionId});
  }

  componentDidUpdate(prevProps) {
    const {collectionId} = this.props;
    if (collectionId !== prevProps.collectionId) {
      this.props.fetchCollection({id: collectionId});
    }
  }

  render() {
    const { collection } = this.props;

    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    if (collection === undefined || collection.isLoading) {
      return <LoadingScreen />;
    }

    const context = {
      'filter:collection_id': collection.id,
      'filter:schemata': 'Document',
      'empty:parent': true
    };

    return (
      <Screen title={collection.label}
              breadcrumbs={<Breadcrumbs collection={collection}/>}
              className='CaseDocumentsScreen'>
        <CaseContext collection={collection} activeTab='Documents'>
          <Toolbar>
            <div className="pt-button-group">
              <DocumentFolderButton collection={collection} />
              <DocumentUploadButton collection={collection} />
            </div>
            <CollectionSearch collection={collection} />
          </Toolbar>
          <EntitySearch context={context}
                        hideCollection={true}
                        documentMode={true} />
        </CaseContext>
      </Screen>
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

CollectionDocumentsScreen = connect(mapStateToProps, {fetchCollection})(CollectionDocumentsScreen);
export default CollectionDocumentsScreen;
