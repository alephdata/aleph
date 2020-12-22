import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import DocumentDropzone from 'components/Document/DocumentDropzone';
import DocumentManager from 'components/Document/DocumentManager';
import { folderDocumentsQuery } from 'queries';

import './FolderViewer.scss';

class FolderViewer extends Component {
  render() {
    const { document, query } = this.props;
    return (
      <div className="FolderViewer">
        <DocumentDropzone
          canDrop={document.collection.writeable}
          collection={document.collection}
          document={document}
        >
          <DocumentManager
            query={query}
            collection={document.collection}
            document={document}
          />
        </DocumentDropzone>
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { document, location } = ownProps;
  // note: this is not currently conducting a search for queryText
  // because the semantics of doing so are confusing.
  return {
    query: folderDocumentsQuery(location, document.id),
  };
};

FolderViewer = connect(mapStateToProps)(FolderViewer);
FolderViewer = withRouter(FolderViewer);
export default FolderViewer;
