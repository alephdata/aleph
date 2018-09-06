import React, { Component } from 'react';
import { connect } from 'react-redux';

import { selectEntity } from 'src/selectors';
import EntitySimilarMode from 'src/components/Entity/EntitySimilarMode';
import DocumentScreenContext from 'src/components/Document/DocumentScreenContext';


class DocumentSimilarScreen extends Component {
  render() {
    const { documentId, document } = this.props;
    return (
      <DocumentScreenContext documentId={documentId} activeMode='similar'>
        <EntitySimilarMode entity={document} />
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

DocumentSimilarScreen = connect(mapStateToProps, {})(DocumentSimilarScreen);
export default DocumentSimilarScreen
