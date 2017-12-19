import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

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
        {document.status === 'fail' && (
          <div className="pt-callout pt-intent-warning">
            <h5>
              <FormattedMessage id="document.status_fail" defaultMessage="This document was not imported correctly"/>
            </h5>
            { document.error_message }
          </div>
        )}
        {document.text && (
          <TextViewer text={document.text} />
        )}
        {document.html && (
          <HtmlViewer html={document.html} />
        )}
        {document.children !== undefined && (
          <FolderViewer document={document} />
        )}
      </DualPane.ContentPane>
    );
  }
}

export default DocumentContent;
