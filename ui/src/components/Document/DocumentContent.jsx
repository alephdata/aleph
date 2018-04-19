import React from 'react';

import { DualPane } from 'src/components/common';
import { DocumentViewer } from 'src/components/DocumentViewer/index';

import './DocumentContent.css';

class DocumentContent extends React.Component {
  render() {
    const { document } = this.props;
    return (
      <DualPane.ContentPane className="DocumentContent">
        <DocumentViewer document={document} showToolbar={true} />
      </DualPane.ContentPane>
    );
  }
}

export default DocumentContent;


