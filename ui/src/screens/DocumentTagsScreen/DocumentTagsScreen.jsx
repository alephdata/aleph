import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import Query from 'src/app/Query';
import { selectEntity } from 'src/selectors';
import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import DocumentViewsMenu from "src/components/ViewsMenu/DocumentViewsMenu";
import DocumentScreenContext from 'src/components/Document/DocumentScreenContext';


class DocumentTagsScreen extends Component {
  render() {
    const { documentId, document, query } = this.props;
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