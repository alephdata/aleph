import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { injectIntl, defineMessages } from 'react-intl';
import queryString from 'query-string';

import { selectEntity, selectDocumentView } from 'src/selectors';
import DocumentViewMode from 'src/components/Document/DocumentViewMode';
import DocumentScreenContext from 'src/components/Document/DocumentScreenContext';

const messages = defineMessages({
  screen_title: {
    id: 'documents.title',
    defaultMessage: 'Document',
  }
});


class DocumentScreen extends Component {
  render() {
    const { intl, documentId, document, mode } = this.props;
    return (
      <DocumentScreenContext documentId={documentId}
                             activeMode={mode}
                             screenTitle={intl.formatMessage(messages.screen_title)}>
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
DocumentScreen = injectIntl(DocumentScreen);
export default DocumentScreen
