import React, { Component } from 'react';

import DualPane from 'src/components/common/DualPane';
import TextViewer from './viewers/TextViewer';
import HtmlViewer from './viewers/HtmlViewer';
import FolderViewer from './viewers/FolderViewer';

class DocumentContent extends Component {
  render() {
    const { document } = this.props;
    return (
      <DualPane.ContentPane>
        <h1>{document.file_name}</h1>
        {document.text && (
          <TextViewer text={document.text} />
        )}
        {document.html && (
          <HtmlViewer html={document.html} />
        )}
        {document.children && (
          <FolderViewer document={document} />
        )}
      </DualPane.ContentPane>
    );
  }
}

export default DocumentContent;
