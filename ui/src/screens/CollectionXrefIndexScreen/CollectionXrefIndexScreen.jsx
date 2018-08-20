import React, { Component } from 'react';
import { connect } from "react-redux";

import { Breadcrumbs } from 'src/components/common';
import { Toolbar, CollectionSearch } from 'src/components/Toolbar';
import DocumentManager from 'src/components/Document/DocumentManager';
import Screen from 'src/components/Screen/Screen';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import CaseContext from "src/components/Case/CaseContext";
import { fetchCollection } from "src/actions";
import { selectCollection } from "src/selectors";


class CollectionXrefIndexScreen extends Component {

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

  render() {
    const { collection } = this.props;

    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    if (collection.id === undefined || collection.isLoading) {
      return <LoadingScreen />;
    }

    return (
      <Screen title={collection.label}
              breadcrumbs={<Breadcrumbs collection={collection}/>}
              className='CollectionXrefIndexScreen'>
        <CaseContext collection={collection} activeTab='Xref'>
          {' todo table of xrefs here '}
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

CollectionXrefIndexScreen = connect(mapStateToProps, {fetchCollection})(CollectionXrefIndexScreen);
export default CollectionXrefIndexScreen;
