import React, { Component } from 'react';
import { connect } from 'react-redux';

import { selectEntity } from 'src/selectors';
import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import DocumentScreenContext from 'src/components/Document/DocumentScreenContext';


class DocumentTagsScreen extends Component {
  render() {
    const { documentId, document } = this.props;
    return (
      <DocumentScreenContext documentId={documentId} activeMode='tags'>
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

DocumentTagsScreen = connect(mapStateToProps, {}, null, { pure: false })(DocumentTagsScreen);
export default DocumentTagsScreen;