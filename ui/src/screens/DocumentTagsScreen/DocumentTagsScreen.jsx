import React, { Component } from 'react';
import { connect } from 'react-redux';

import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import DocumentScreenContext from 'src/components/Document/DocumentScreenContext';
import { selectEntity } from 'src/selectors';


class DocumentTagsScreen extends Component {
  render() {
    const { documentId, document } = this.props;
    return (
      <DocumentScreenContext documentId={documentId} activeMode='tags' subtitle='Tags'>
        <EntityTagsMode entity={document} />
      </DocumentScreenContext>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { documentId } = ownProps.match.params;
  return {
    documentId,
    document: selectEntity(state, documentId)
  };
};

DocumentTagsScreen = connect(mapStateToProps, {})(DocumentTagsScreen);
export default DocumentTagsScreen;