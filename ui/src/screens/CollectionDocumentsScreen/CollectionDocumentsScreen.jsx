import React, { Component } from 'react';
import { connect } from "react-redux";
import { FormattedMessage } from 'react-intl';

import { Breadcrumbs } from 'src/components/common';
import { Toolbar, DocumentUploadButton, DocumentFolderButton, CollectionSearch } from 'src/components/Toolbar';
import Screen from 'src/components/Screen/Screen';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import CaseContext from "src/components/Case/CaseContext";
import { fetchCollection, deleteDocument } from "src/actions";
import { selectCollection } from "src/selectors";
import EntitySearch from "src/components/EntitySearch/EntitySearch";
import DocumentDeleteDialog from 'src/dialogs/DocumentDeleteDialog/DocumentDeleteDialog';
import { RefreshCallout } from 'src/components/common';

class CollectionDocumentsScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isDeleteDisabled: true,
      selectedFiles: [],
      deleteIsOpen: false,
      isRefreshCalloutOpen: false
    };

    this.disableOrEnableDelete = this.disableOrEnableDelete.bind(this);
    this.setDocuments = this.setDocuments.bind(this);
    this.toggleDeleteCase = this.toggleDeleteCase.bind(this);
    this.setRefreshCallout = this.setRefreshCallout.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const {collectionId, collection} = this.props;
    if (collection.shouldLoad) {
      this.props.fetchCollection({id: collectionId});
    }
  }

  setDocuments(selectedFiles) {
    this.setState({selectedFiles: selectedFiles});
  }

  disableOrEnableDelete(isDisabled) {
    this.setState({isDeleteDisabled: isDisabled});
  }

  toggleDeleteCase() {
    this.setState({deleteIsOpen: !this.state.deleteIsOpen});
  }

  setRefreshCallout() {
    this.setState({isRefreshCalloutOpen: !this.state.isRefreshCalloutOpen});
  }

  render() {
    const { collection } = this.props;
    const { isDeleteDisabled, selectedFiles, isRefreshCalloutOpen } = this.state;

    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    if (collection.id === undefined || collection.isLoading) {
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
          {isRefreshCalloutOpen && <RefreshCallout/>}
          <Toolbar>
            <div className="pt-button-group">
              <DocumentFolderButton collection={collection} />
              <DocumentUploadButton collection={collection} />
              {collection.writeable &&
              <button
                type="button"
                className="pt-button pt-icon-delete"
                disabled={isDeleteDisabled}
                onClick={this.toggleDeleteCase}><FormattedMessage id="collection.documents.delete"
                                                                  defaultMessage="Delete" /></button>}
            </div>
            <CollectionSearch collection={collection} />
          </Toolbar>
          <EntitySearch context={context}
                        hideCollection={true}
                        documentMode={true}
                        writable={collection.writeable}
                        disableOrEnableDelete={this.disableOrEnableDelete}
                        setDocuments={this.setDocuments}
                        setRefreshCallout={this.setRefreshCallout}/>
          <DocumentDeleteDialog documents={selectedFiles}
                                  isOpen={this.state.deleteIsOpen}
                                  toggleDialog={this.toggleDeleteCase}
                                  path={'/collections/' + collection.id + '/documents'}/>
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

CollectionDocumentsScreen = connect(mapStateToProps, {fetchCollection, deleteDocument})(CollectionDocumentsScreen);
export default CollectionDocumentsScreen;
