import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import queryString from 'query-string';

import { selectEntity } from 'src/selectors';
import DocumentViewer from 'src/components/DocumentViewer/DocumentViewer';
import DocumentScreenContext from 'src/components/Document/DocumentScreenContext';


class DocumentScreen extends Component {
  render() {
    const { documentId, document, mode } = this.props;
    return (
      <DocumentScreenContext documentId={documentId} activeMode={mode}>
        <DocumentViewer document={document} />
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
    mode: hashQuery.mode || 'view'
  };
};

DocumentScreen = connect(mapStateToProps, {})(DocumentScreen);
DocumentScreen = withRouter(DocumentScreen);
DocumentScreen = injectIntl(DocumentScreen);
export default DocumentScreen
