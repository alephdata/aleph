import React from 'react';
import { FormattedMessage } from 'react-intl';

import DualPane from 'src/components/common/DualPane';
import { DocumentViewer } from 'src/components/DocumentViewer';

import './DocumentContent.css';

class DocumentContent extends React.Component {
  render() {
    const { document: doc } = this.props;
    return (
      <DualPane.ContentPane className="DocumentContent">
        <DocumentViewer document={doc} showToolbar={true} />
      </DualPane.ContentPane>
    );
  }
}

export default DocumentContent;


