import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import DualPane from 'src/components/common/DualPane';
import TextViewer from './viewers/TextViewer';
import HtmlViewer from './viewers/HtmlViewer';
import PdfViewer from './viewers/PdfViewer';
import ImageViewer from './viewers/ImageViewer';
import FolderViewer from './viewers/FolderViewer';
import EmailHeadersViewer from './viewers/EmailHeadersViewer';

import './DocumentContent.css';

class DocumentContent extends Component {
  render() {
    const { document, fragId } = this.props;

    return (
      <DualPane.ContentPane>
        {document.status === 'fail' && (
          <div className="IngestFailed pt-callout pt-intent-warning">
            <h5>
              <FormattedMessage id="document.status_fail"
                                defaultMessage="This document was not imported successfully"/>
            </h5>
            { document.error_message }
          </div>
        )}

        {document.schema === 'Email' && (
          <EmailHeadersViewer document={document} />
        )}

        {document.text && !document.html && (
          <TextViewer text={document.text} />
        )}

        {document.html && (
          <HtmlViewer html={document.html} />
        )}

        {document.links && document.links.pdf && (
          <PdfViewer
            url={document.links.pdf}
            fragId={fragId}
          />
        )}

        {document.schema === 'Image' && (
          <ImageViewer document={document} />
        )}

        {document.children !== undefined && document.children > 0 && (
          <FolderViewer document={document} />
        )}
      </DualPane.ContentPane>
    );
  }
}

export default DocumentContent;
