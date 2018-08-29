import React from 'react';

import { DualPane } from 'src/components/common';
import { DocumentViewer } from 'src/components/DocumentViewer/index';
import DocumentViewsMenu from "src/components/ViewsMenu/DocumentViewsMenu";

import './DocumentContent.css';

class DocumentContent extends React.Component {
  render() {
    const { document } = this.props;
    return (
      <DualPane.ContentPane className="DocumentContent">
        <DocumentViewsMenu document={document} showToolbar={true} isPreview={false}/>
        <DocumentViewer document={document} showToolbar={true} />
      </DualPane.ContentPane>
    );
  }
}

export default DocumentContent;
