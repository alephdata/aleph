import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, defineMessages } from 'react-intl';

import { selectEntity } from 'src/selectors';
import EntitySimilarMode from 'src/components/Entity/EntitySimilarMode';
import DocumentScreenContext from 'src/components/Document/DocumentScreenContext';

const messages = defineMessages({
  screen_title: {
    id: 'document.similar.title',
    defaultMessage: 'Similar',
  }
});


class DocumentSimilarScreen extends Component {
  render() {
    const { intl, documentId, document } = this.props;
    return (
      <DocumentScreenContext documentId={documentId}
                             activeMode='similar'
                             screenTitle={intl.formatMessage(messages.screen_title)}>
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

DocumentSimilarScreen = injectIntl(DocumentSimilarScreen);
DocumentSimilarScreen = connect(mapStateToProps, {})(DocumentSimilarScreen);
export default DocumentSimilarScreen
