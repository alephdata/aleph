import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import DualPane from 'src/components/common/DualPane';
import TableViewer from './viewers/TableViewer';
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
          <section className="PartialError">
            <div className="pt-non-ideal-state">
              <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
                <span className="pt-icon pt-icon-issue"></span>
              </div>
              <h4 className="pt-non-ideal-state-title">
                <FormattedMessage id="document.status_fail"
                                  defaultMessage="Document failed to import"/>
              </h4>
              <div className="pt-non-ideal-state-description">
                { document.error_message }
              </div>
            </div>
          </section>
        )}

        {document.schema === 'Email' && (
          <EmailHeadersViewer document={document} />
        )}

        {document.schema === 'Table' && (
          <TableViewer document={document}/>
        )}

        {document.text && !document.html && (
          <TextViewer text={document.text} />
        )}

        {document.html && (
          <HtmlViewer html={document.html} />
        )}

        {document.links && document.links.pdf && (
          <PdfViewer document={document} fragId={fragId} />
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
