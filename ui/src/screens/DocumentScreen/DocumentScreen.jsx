import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import queryString from 'query-string';

import { fetchDocument } from 'src/actions';
import { selectEntity } from 'src/selectors';
import { Entity, Breadcrumbs, DualPane } from 'src/components/common';
import Screen from 'src/components/Screen/Screen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
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

DocumentScreen = connect(mapStateToProps, { fetchDocument })(DocumentScreen);
DocumentScreen = withRouter(DocumentScreen);
DocumentScreen = injectIntl(DocumentScreen);
export default DocumentScreen
