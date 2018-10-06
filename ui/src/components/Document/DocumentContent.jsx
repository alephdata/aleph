import React from 'react';

import { DualPane } from 'src/components/common';
import DocumentViewMode from 'src/components/Document/DocumentViewMode';
import DocumentViewsMenu from "src/components/ViewsMenu/DocumentViewsMenu";

import './DocumentContent.css';


class DocumentContent extends React.Component {
  render() {
    const { document } = this.props;
    return (
      <DualPane.ContentPane className="view-menu-flex-direction">
        <DocumentViewsMenu document={document} isPreview={false}/>
        <DocumentViewMode document={document} />
      </DualPane.ContentPane>
    );
  }
}

export default DocumentContent;
