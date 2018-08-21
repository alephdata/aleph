import React from 'react';

import { DualPane } from 'src/components/common';
import { DocumentViewer } from 'src/components/DocumentViewer/index';

import './DocumentContent.css';
import DocumentViewsMenu from "../ViewsMenu/DocumentViewsMenu";

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
