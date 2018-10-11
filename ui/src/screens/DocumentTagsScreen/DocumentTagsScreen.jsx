import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, defineMessages } from 'react-intl';

import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import DocumentScreenContext from 'src/components/Document/DocumentScreenContext';
import { selectEntity } from 'src/selectors';

const messages = defineMessages({
  screen_title: {
    id: 'document.tags.title',
    defaultMessage: 'Connections',
  }
});


class DocumentTagsScreen extends Component {
  render() {
    const { intl, documentId, document } = this.props;
    return (
      <DocumentScreenContext documentId={documentId}
                             activeMode='tags'
                             screenTitle={intl.formatMessage(messages.screen_title)}>
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

DocumentTagsScreen = injectIntl(DocumentTagsScreen);
DocumentTagsScreen = connect(mapStateToProps, {})(DocumentTagsScreen);
export default DocumentTagsScreen;