import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { FormattedMessage } from 'react-intl';

import DocumentDropzone from 'src/components/Document/DocumentDropzone';
import DocumentManager from 'src/components/Document/DocumentManager';
import { queryFolderDocuments } from 'src/queries';
import c from 'classnames';

import './FolderViewer.scss';
/* eslint-disable */

class FolderViewer extends Component {
  render() {
    const { document, query, className } = this.props;
    return (
      <div className={c('FolderViewer', className)}>
        <DocumentDropzone
          canDrop={document.collection.writeable}
          collection={document.collection}
          document={document}
        >
          {document.status === 'fail' && (
            <div className="warning-folder">
              <strong>
                <FormattedMessage id="search.warning" defaultMessage="Warning:" />
              </strong>
              &nbsp;
              <p>
                <FormattedMessage
                  id="search.not_properly_imported"
                  defaultMessage="This folder is not fully imported."
                />
              </p>
            </div>
          )}
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
    query: queryFolderDocuments(location, document.id),
  };
};

FolderViewer = connect(mapStateToProps)(FolderViewer);
FolderViewer = withRouter(FolderViewer);
export default FolderViewer;
