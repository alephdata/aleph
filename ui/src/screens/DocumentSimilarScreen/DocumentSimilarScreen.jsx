import React, { Component } from 'react';
import { connect } from 'react-redux';

import Query from 'src/app/Query';
import { selectEntity } from 'src/selectors';
import EntitySimilarMode from 'src/components/Entity/EntitySimilarMode';
import DocumentScreenContext from 'src/components/Document/DocumentScreenContext';


class DocumentSimilarScreen extends Component {
  render() {
    const { documentId, document, query } = this.props;
    return (
      <DocumentScreenContext documentId={documentId} activeMode='similar'>
        <EntitySimilarMode entity={document} query={query} />
      </DocumentScreenContext>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { documentId } = ownProps.match.params;
  const path = documentId ? `entities/${documentId}/similar` : undefined;
  const query = Query.fromLocation(path, {}, {}, 'similar').limit(75);
  return {
    documentId,
    document: selectEntity(state, documentId),
    query: query
  };
};

DocumentSimilarScreen = connect(mapStateToProps, {}, null, { pure: false })(DocumentSimilarScreen);
export default DocumentSimilarScreen
