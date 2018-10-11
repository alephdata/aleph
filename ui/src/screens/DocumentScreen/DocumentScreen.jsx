import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import queryString from 'query-string';

import { selectEntity, selectDocumentView } from 'src/selectors';
import DocumentViewMode from 'src/components/Document/DocumentViewMode';
import DocumentScreenContext from 'src/components/Document/DocumentScreenContext';


class DocumentScreen extends Component {
  render() {
    const { documentId, document, mode } = this.props;
    return (
      <DocumentScreenContext documentId={documentId}
                             activeMode={mode}>
        <DocumentViewMode document={document} activeMode={mode} />
      </DocumentScreenContext>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { documentId } = ownProps.match.params;
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);  
  return {
    documentId,
    document: selectEntity(state, documentId),
    mode: selectDocumentView(state, documentId, hashQuery.mode)
  };
};

DocumentScreen = connect(mapStateToProps, {})(DocumentScreen);
DocumentScreen = withRouter(DocumentScreen);
export default DocumentScreen
