import React, { Component } from 'react';
import { connect } from "react-redux";

import { Screen, Breadcrumbs, ScreenLoading } from 'src/components/common';
import { Toolbar, DocumentUploadButton, DocumentFolderButton, CollectionSearch } from 'src/components/Toolbar';
import CaseContext from "src/components/Case/CaseContext";
import { fetchCollection } from "src/actions";
import { selectCollection } from "src/selectors";
import EntitySearch from "src/components/EntitySearch/EntitySearch";

import './CaseDocumentsScreen.css';


class CaseDocumentsContent extends Component {
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

    if (collection === undefined || collection.id === undefined) {
      return <ScreenLoading />;
    }

    const context = {
      'filter:collection_id': collection.id,
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

CaseDocumentsContent = connect(mapStateToProps, {fetchCollection})(CaseDocumentsContent);
export default CaseDocumentsContent;
